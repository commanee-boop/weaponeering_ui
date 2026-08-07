import express from 'express'
import pg from 'pg'
import { createHash, randomUUID } from 'node:crypto'
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises'
import path from 'node:path'

const { Pool } = pg
const app = express()
const port = Number(process.env.PORT || 3000)
const mediaRoot = path.resolve(process.env.MEDIA_ROOT || path.join(process.cwd(), 'server_media'))
const maxImageBytes = 8 * 1024 * 1024

await mkdir(mediaRoot, { recursive: true })

const pool = new Pool({
  host: process.env.POSTGRES_HOST,
  port: Number(process.env.POSTGRES_PORT || 5432),
  database: process.env.POSTGRES_DB,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
})

app.disable('x-powered-by')
app.use(express.json({ limit: '24mb' }))

const reportEventClients = new Set()

const broadcastReportChange = (operation, record) => {
  const message = `event: changed\ndata: ${JSON.stringify({ operation, record })}\n\n`
  for (const client of reportEventClients) {
    try {
      client.write(message)
    } catch (_error) {
      reportEventClients.delete(client)
    }
  }
}

const textOrNull = (value, maxLength = 2000) => {
  if (value === undefined || value === null) return null
  const text = String(value).trim()
  return text ? text.slice(0, maxLength) : null
}

const numberOrNull = (value) => {
  if (value === undefined || value === null || value === '') return null
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

const imageTypes = {
  'image/png': { extension: 'png', valid: buffer => buffer.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex')) },
  'image/jpeg': { extension: 'jpg', valid: buffer => buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff },
  'image/gif': { extension: 'gif', valid: buffer => ['GIF87a', 'GIF89a'].includes(buffer.subarray(0, 6).toString('ascii')) },
  'image/bmp': { extension: 'bmp', valid: buffer => buffer.subarray(0, 2).toString('ascii') === 'BM' },
}

const parseImageUpload = (imagePreview, imageName) => {
  if (imagePreview === undefined || imagePreview === null || imagePreview === '') return null
  if (typeof imagePreview !== 'string') throw new Error('imagePreview must be an image data URL')

  const match = imagePreview.match(/^data:(image\/(?:png|jpeg|gif|bmp));base64,([a-z0-9+/=\s]+)$/i)
  if (!match) throw new Error('Only PNG, JPEG, GIF, or BMP images are supported')

  const contentType = match[1].toLowerCase()
  const normalizedBase64 = match[2].replace(/\s/g, '')
  const buffer = Buffer.from(normalizedBase64, 'base64')
  const canonicalInput = normalizedBase64.replace(/=+$/, '')
  const canonicalOutput = buffer.toString('base64').replace(/=+$/, '')
  if (!buffer.length || canonicalInput !== canonicalOutput || !imageTypes[contentType].valid(buffer)) {
    throw new Error('The uploaded image data is invalid')
  }
  if (buffer.length > maxImageBytes) throw new Error('Image size must not exceed 8 MB')

  const originalFilename = textOrNull(path.basename(String(imageName || `target.${imageTypes[contentType].extension}`)), 255)
    ?.replace(/[\u0000-\u001f\u007f]/g, '_') || `target.${imageTypes[contentType].extension}`
  const objectKey = `${randomUUID()}.${imageTypes[contentType].extension}`
  return {
    buffer,
    contentType,
    objectKey,
    originalFilename,
    checksum: createHash('sha256').update(buffer).digest('hex'),
  }
}

const attachImageFields = async row => {
  const result = await pool.query({
    text: `
      SELECT attachment_type, object_key, original_filename, content_type, size_bytes
      FROM app.attachments
      WHERE analysis_record_id = $1
      ORDER BY created_at, id
    `,
    values: [row.id],
  })
  row.attachment_data = Object.fromEntries(result.rows.map(attachment => [
    attachment.attachment_type,
    {
      object_key: attachment.object_key,
      original_filename: attachment.original_filename,
      content_type: attachment.content_type,
      size_bytes: Number(attachment.size_bytes),
    },
  ]))
  return row
}

const validateRecord = (body) => {
  const errors = []
  const recorderName = textOrNull(body.recorderName, 200)
  const latitude = numberOrNull(body.latitude)
  const longitude = numberOrNull(body.longitude)
  const pk = numberOrNull(body.pk)
  const cep = numberOrNull(body.cep)

  if (!recorderName) errors.push('recorderName is required')
  if (latitude !== null && (latitude < -90 || latitude > 90)) errors.push('latitude must be between -90 and 90')
  if (longitude !== null && (longitude < -180 || longitude > 180)) errors.push('longitude must be between -180 and 180')
  if (pk !== null && (pk < 0 || pk > 1)) errors.push('pk must be between 0 and 1')
  if (cep !== null && cep < 0) errors.push('cep must be zero or greater')

  return { errors, recorderName, latitude, longitude, pk, cep }
}

const mapRecord = row => {
  const targetImage = row.attachment_data?.target_image || {}
  const coordinateMap = row.attachment_data?.coordinate_map || {}
  return {
    ...(row.raw_data && typeof row.raw_data === 'object' ? row.raw_data : {}),
    id: row.id,
    tgt: row.record_code,
    targetName: row.target_name,
    selectedTargetSource: row.target_source,
    targetType: row.target_type,
    targetPriority: row.target_priority,
    structureType: row.structure_type,
    strengthLevel: row.strength_level,
    targetDetails: row.target_details,
    desiredEffect: row.desired_effect,
    latitude: row.latitude,
    longitude: row.longitude,
    pk: row.pk === null ? null : Number(row.pk),
    cep: row.cep_meters === null ? null : Number(row.cep_meters),
    heightMslFt: row.height_msl_ft === null ? null : Number(row.height_msl_ft),
    recorderName: row.recorder_name,
    summary: row.summary,
    imageName: targetImage.original_filename || row.raw_data?.imageName || '',
    imagePreview: targetImage.object_key ? `/api/media/${encodeURIComponent(targetImage.object_key)}` : '',
    imageContentType: targetImage.content_type || null,
    imageSizeBytes: targetImage.size_bytes === undefined ? null : Number(targetImage.size_bytes),
    coordinateImageName: coordinateMap.original_filename || '',
    coordinateImagePreview: coordinateMap.object_key ? `/api/media/${encodeURIComponent(coordinateMap.object_key)}` : '',
    coordinateImageContentType: coordinateMap.content_type || null,
    coordinateImageSizeBytes: coordinateMap.size_bytes === undefined ? null : Number(coordinateMap.size_bytes),
    savedAt: row.created_at,
  }
}

const isUuid = (value) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)

app.get('/api/health', async (_request, response, next) => {
  try {
    await pool.query('SELECT 1')
    response.json({ status: 'ok' })
  } catch (error) {
    next(error)
  }
})

app.get('/api/media/:objectKey', async (request, response, next) => {
  try {
    const { objectKey } = request.params
    if (!/^[0-9a-f-]{36}\.(?:png|jpg|gif|bmp)$/i.test(objectKey)) {
      return response.status(400).json({ error: 'Invalid media key' })
    }

    const result = await pool.query({
      text: 'SELECT content_type FROM app.attachments WHERE object_key = $1',
      values: [objectKey],
    })
    if (!result.rowCount) return response.status(404).json({ error: 'Image not found' })

    try {
      const image = await readFile(path.join(mediaRoot, objectKey))
      response.set({
        'Content-Type': result.rows[0].content_type,
        'Content-Length': image.length,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
      })
      return response.send(image)
    } catch (error) {
      if (error.code === 'ENOENT') return response.status(404).json({ error: 'Image file not found' })
      throw error
    }
  } catch (error) {
    return next(error)
  }
})

app.get('/api/analysis-records/events', (request, response) => {
  response.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  })
  response.flushHeaders()
  response.write('retry: 3000\nevent: connected\ndata: {"status":"ok"}\n\n')
  reportEventClients.add(response)

  const heartbeat = setInterval(() => {
    response.write(': heartbeat\n\n')
  }, 25_000)

  request.on('close', () => {
    clearInterval(heartbeat)
    reportEventClients.delete(response)
  })
})

app.get('/api/analysis-records/count', async (_request, response, next) => {
  try {
    const result = await pool.query(
      'SELECT count(*)::integer AS count FROM app.analysis_records WHERE deleted_at IS NULL',
    )
    response.json({ count: result.rows[0].count })
  } catch (error) {
    next(error)
  }
})

app.get('/api/analysis-records', async (_request, response, next) => {
  try {
    const result = await pool.query(`
      SELECT
        records.*,
        COALESCE(attachment.attachment_data, '{}'::jsonb) AS attachment_data
      FROM app.analysis_records AS records
      LEFT JOIN LATERAL (
        SELECT jsonb_object_agg(
          attachment_type,
          jsonb_build_object(
            'object_key', object_key,
            'original_filename', original_filename,
            'content_type', content_type,
            'size_bytes', size_bytes
          )
        ) AS attachment_data
        FROM app.attachments
        WHERE analysis_record_id = records.id
      ) AS attachment ON true
      WHERE records.deleted_at IS NULL
      ORDER BY
        CASE
          WHEN records.record_code ~ '^TGT - [0-9]+$'
            THEN substring(records.record_code FROM '([0-9]+)$')::bigint
        END ASC NULLS LAST,
        records.created_at ASC,
        records.id ASC
      LIMIT 500
    `)
    response.json({ records: result.rows.map(mapRecord) })
  } catch (error) {
    next(error)
  }
})

app.post('/api/analysis-records', async (request, response, next) => {
  const storedImagePaths = []
  let client = null
  let committed = false
  try {
    const body = request.body
    if (!body || Array.isArray(body) || typeof body !== 'object') {
      return response.status(400).json({ error: 'Request body must be a JSON object' })
    }

    const validated = validateRecord(body)
    if (validated.errors.length) {
      return response.status(400).json({ error: 'Invalid analysis record', details: validated.errors })
    }

    const priority = ['red', 'orange', 'green', 'unassigned'].includes(body.targetPriority)
      ? body.targetPriority
      : 'unassigned'
    let imageUploads
    try {
      imageUploads = [
        {
          attachmentType: 'target_image',
          upload: parseImageUpload(body.imagePreview, body.imageName),
        },
        {
          attachmentType: 'coordinate_map',
          upload: parseImageUpload(body.coordinateImagePreview, body.coordinateImageName),
        },
      ].filter(item => item.upload)
    } catch (error) {
      return response.status(400).json({ error: 'Invalid image', details: [error.message] })
    }
    const {
      imagePreview: _imagePreview,
      coordinateImagePreview: _coordinateImagePreview,
      ...rawData
    } = body

    client = await pool.connect()
    await client.query('BEGIN')
    const result = await client.query({
      text: `
        INSERT INTO app.analysis_records (
          record_code,
          target_name,
          target_source,
          target_type,
          target_priority,
          structure_type,
          strength_level,
          target_details,
          desired_effect,
          latitude,
          longitude,
          pk,
          cep_meters,
          height_msl_ft,
          recorder_name,
          summary,
          raw_data
        )
        VALUES (
          DEFAULT,
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15::jsonb, $16::jsonb
        )
        RETURNING *
      `,
      values: [
        textOrNull(body.targetName || body.selectedTargetSource, 500),
        textOrNull(body.selectedTargetSource, 500),
        textOrNull(body.targetType, 500),
        priority,
        textOrNull(body.structureType, 500),
        textOrNull(body.strengthLevel, 500),
        textOrNull(body.targetDetails, 20_000),
        textOrNull(body.desiredEffect, 500),
        validated.latitude,
        validated.longitude,
        validated.pk,
        validated.cep,
        numberOrNull(body.heightMslFt),
        validated.recorderName,
        JSON.stringify(body.summary || {}),
        JSON.stringify(rawData),
      ],
    })

    result.rows[0].attachment_data = {}
    for (const { attachmentType, upload } of imageUploads) {
      const storedImagePath = path.join(mediaRoot, upload.objectKey)
      await writeFile(storedImagePath, upload.buffer, { flag: 'wx' })
      storedImagePaths.push(storedImagePath)
      await client.query({
        text: `
          INSERT INTO app.attachments (
            analysis_record_id,
            attachment_type,
            object_key,
            original_filename,
            content_type,
            size_bytes,
            checksum_sha256
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `,
        values: [
          result.rows[0].id,
          attachmentType,
          upload.objectKey,
          upload.originalFilename,
          upload.contentType,
          upload.buffer.length,
          upload.checksum,
        ],
      })
      result.rows[0].attachment_data[attachmentType] = {
        object_key: upload.objectKey,
        original_filename: upload.originalFilename,
        content_type: upload.contentType,
        size_bytes: upload.buffer.length,
      }
    }

    await client.query('COMMIT')
    committed = true

    const record = mapRecord(result.rows[0])
    broadcastReportChange('created', record)
    return response.status(201).json({ record })
  } catch (error) {
    if (client && !committed) {
      try {
        await client.query('ROLLBACK')
      } catch (_rollbackError) {
        // Preserve the original error.
      }
    }
    if (!committed) {
      await Promise.all(storedImagePaths.map(async storedImagePath => {
        try {
          await unlink(storedImagePath)
        } catch (cleanupError) {
          if (cleanupError.code !== 'ENOENT') console.error('Unable to clean up image after failed save', cleanupError)
        }
      }))
    }
    if (error.code === '23505') {
      return response.status(409).json({ error: 'A record with this code already exists' })
    }
    return next(error)
  } finally {
    client?.release()
  }
})

app.patch('/api/analysis-records/:id', async (request, response, next) => {
  let client = null
  let committed = false
  let storedImagePath = null
  let replacedObjectKey = null
  try {
    const { id } = request.params
    const body = request.body
    if (!isUuid(id)) return response.status(400).json({ error: 'Invalid record id' })
    if (!body || Array.isArray(body) || typeof body !== 'object') {
      return response.status(400).json({ error: 'Request body must be a JSON object' })
    }

    const latitude = numberOrNull(body.latitude)
    const longitude = numberOrNull(body.longitude)
    const pk = numberOrNull(body.pk)
    const cep = numberOrNull(body.cep)
    const errors = []
    if (latitude !== null && (latitude < -90 || latitude > 90)) errors.push('latitude must be between -90 and 90')
    if (longitude !== null && (longitude < -180 || longitude > 180)) errors.push('longitude must be between -180 and 180')
    if (pk !== null && (pk < 0 || pk > 1)) errors.push('pk must be between 0 and 1')
    if (cep !== null && cep < 0) errors.push('cep must be zero or greater')
    if (errors.length) return response.status(400).json({ error: 'Invalid analysis record', details: errors })

    let coordinateUpload = null
    try {
      coordinateUpload = parseImageUpload(body.coordinateImagePreview, body.coordinateImageName)
    } catch (error) {
      return response.status(400).json({ error: 'Invalid coordinate image', details: [error.message] })
    }

    const priorityFromImportance = { key: 'red', medium: 'orange', general: 'green' }
    const requestedPriority = body.targetPriority || priorityFromImportance[body.importance]
    const priority = ['red', 'orange', 'green', 'unassigned'].includes(requestedPriority)
      ? requestedPriority
      : 'unassigned'
    const rawPatch = {
      targetImportance: body.targetImportance,
      dmpiCoordinates: body.dmpiCoordinates,
      importance: body.importance,
      status: body.status,
      weaponUsed: body.weaponUsed,
      dateValue: body.dateValue,
    }

    client = await pool.connect()
    await client.query('BEGIN')
    const result = await client.query({
      text: `
        UPDATE app.analysis_records
        SET
          target_name = $1,
          target_source = $2,
          target_type = $3,
          target_priority = $4,
          structure_type = $5,
          strength_level = $6,
          target_details = $7,
          desired_effect = $8,
          latitude = $9,
          longitude = $10,
          pk = $11,
          cep_meters = $12,
          height_msl_ft = $13,
          raw_data = raw_data || $14::jsonb
        WHERE id = $15 AND deleted_at IS NULL
        RETURNING *
      `,
      values: [
        textOrNull(body.targetName, 500),
        textOrNull(body.source || body.selectedTargetSource, 500),
        textOrNull(body.type || body.targetType, 500),
        priority,
        textOrNull(body.structureType, 500),
        textOrNull(body.strengthLevel, 500),
        textOrNull(body.targetDescription || body.targetDetails, 20_000),
        textOrNull(body.desiredEffect, 500),
        latitude,
        longitude,
        pk,
        cep,
        numberOrNull(body.heightMslFt),
        JSON.stringify(rawPatch),
        id,
      ],
    })

    if (!result.rowCount) {
      await client.query('ROLLBACK')
      return response.status(404).json({ error: 'Analysis record not found' })
    }

    if (coordinateUpload) {
      const existingAttachment = await client.query({
        text: `
          SELECT object_key
          FROM app.attachments
          WHERE analysis_record_id = $1 AND attachment_type = 'coordinate_map'
          FOR UPDATE
        `,
        values: [id],
      })
      replacedObjectKey = existingAttachment.rows[0]?.object_key || null
      storedImagePath = path.join(mediaRoot, coordinateUpload.objectKey)
      await writeFile(storedImagePath, coordinateUpload.buffer, { flag: 'wx' })

      await client.query({
        text: `
          INSERT INTO app.attachments (
            analysis_record_id,
            attachment_type,
            object_key,
            original_filename,
            content_type,
            size_bytes,
            checksum_sha256
          )
          VALUES ($1, 'coordinate_map', $2, $3, $4, $5, $6)
          ON CONFLICT (analysis_record_id, attachment_type)
          DO UPDATE SET
            object_key = EXCLUDED.object_key,
            original_filename = EXCLUDED.original_filename,
            content_type = EXCLUDED.content_type,
            size_bytes = EXCLUDED.size_bytes,
            checksum_sha256 = EXCLUDED.checksum_sha256,
            created_at = now()
        `,
        values: [
          id,
          coordinateUpload.objectKey,
          coordinateUpload.originalFilename,
          coordinateUpload.contentType,
          coordinateUpload.buffer.length,
          coordinateUpload.checksum,
        ],
      })
    }

    await client.query('COMMIT')
    committed = true

    if (replacedObjectKey && replacedObjectKey !== coordinateUpload?.objectKey) {
      try {
        await unlink(path.join(mediaRoot, replacedObjectKey))
      } catch (error) {
        if (error.code !== 'ENOENT') console.error(`Unable to remove replaced coordinate image ${replacedObjectKey}`, error)
      }
    }

    await attachImageFields(result.rows[0])
    const record = mapRecord(result.rows[0])
    broadcastReportChange('updated', record)
    return response.json({ record })
  } catch (error) {
    if (client && !committed) {
      try {
        await client.query('ROLLBACK')
      } catch (_rollbackError) {
        // Preserve the original error.
      }
    }
    if (storedImagePath && !committed) {
      try {
        await unlink(storedImagePath)
      } catch (cleanupError) {
        if (cleanupError.code !== 'ENOENT') console.error('Unable to clean up coordinate image after failed update', cleanupError)
      }
    }
    if (error.code === '23505') {
      return response.status(409).json({ error: 'A record with this code already exists' })
    }
    return next(error)
  } finally {
    client?.release()
  }
})

app.delete('/api/analysis-records/:id', async (request, response, next) => {
  let client
  try {
    const { id } = request.params
    if (!isUuid(id)) return response.status(400).json({ error: 'Invalid record id' })

    client = await pool.connect()
    await client.query('BEGIN')
    await client.query('LOCK TABLE app.analysis_records IN SHARE ROW EXCLUSIVE MODE')

    const attachmentResult = await client.query({
      text: 'SELECT object_key FROM app.attachments WHERE analysis_record_id = $1',
      values: [id],
    })
    const result = await client.query(
      'DELETE FROM app.analysis_records WHERE id = $1 RETURNING id',
      [id],
    )
    if (!result.rowCount) {
      await client.query('ROLLBACK')
      return response.status(404).json({ error: 'Analysis record not found' })
    }

    await client.query('SELECT app.resequence_target_record_codes()')
    await client.query('COMMIT')

    await Promise.all(attachmentResult.rows.map(async ({ object_key: objectKey }) => {
      try {
        await unlink(path.join(mediaRoot, objectKey))
      } catch (error) {
        if (error.code !== 'ENOENT') console.error(`Unable to remove image ${objectKey}`, error)
      }
    }))
    broadcastReportChange('deleted', { id: result.rows[0].id })
    return response.status(204).send()
  } catch (error) {
    if (client) {
      try {
        await client.query('ROLLBACK')
      } catch (rollbackError) {
        console.error('Unable to roll back record deletion', rollbackError)
      }
    }
    return next(error)
  } finally {
    client?.release()
  }
})

app.use((error, _request, response, _next) => {
  if (error.type === 'entity.too.large') {
    return response.status(413).json({ error: 'Request body is too large; image size must not exceed 8 MB' })
  }
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return response.status(400).json({ error: 'Request body contains invalid JSON' })
  }
  console.error(error)
  return response.status(500).json({ error: 'Internal server error' })
})

const server = app.listen(port, '0.0.0.0', () => {
  console.log(`API listening on port ${port}`)
})

const shutdown = (signal) => {
  console.log(`${signal} received, shutting down`)
  server.close(async () => {
    await pool.end()
    process.exit(0)
  })
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))
