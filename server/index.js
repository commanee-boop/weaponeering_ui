import express from 'express'
import pg from 'pg'

const { Pool } = pg
const app = express()
const port = Number(process.env.PORT || 3000)

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
app.use(express.json({ limit: '1mb' }))

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

const mapRecord = (row) => ({
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
  savedAt: row.created_at,
})

const isUuid = (value) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)

app.get('/api/health', async (_request, response, next) => {
  try {
    await pool.query('SELECT 1')
    response.json({ status: 'ok' })
  } catch (error) {
    next(error)
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
      SELECT *
      FROM app.analysis_records
      WHERE deleted_at IS NULL
      ORDER BY
        CASE
          WHEN record_code ~ '^TGT - [0-9]+$'
            THEN substring(record_code FROM '([0-9]+)$')::bigint
        END ASC NULLS LAST,
        created_at ASC,
        id ASC
      LIMIT 500
    `)
    response.json({ records: result.rows.map(mapRecord) })
  } catch (error) {
    next(error)
  }
})

app.post('/api/analysis-records', async (request, response, next) => {
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
    const { imagePreview: _imagePreview, ...rawData } = body

    const result = await pool.query({
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

    const record = mapRecord(result.rows[0])
    broadcastReportChange('created', record)
    return response.status(201).json({ record })
  } catch (error) {
    if (error.code === '23505') {
      return response.status(409).json({ error: 'A record with this code already exists' })
    }
    return next(error)
  }
})

app.patch('/api/analysis-records/:id', async (request, response, next) => {
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

    const result = await pool.query({
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

    if (!result.rowCount) return response.status(404).json({ error: 'Analysis record not found' })
    const record = mapRecord(result.rows[0])
    broadcastReportChange('updated', record)
    return response.json({ record })
  } catch (error) {
    if (error.code === '23505') {
      return response.status(409).json({ error: 'A record with this code already exists' })
    }
    return next(error)
  }
})

app.delete('/api/analysis-records/:id', async (request, response, next) => {
  try {
    const { id } = request.params
    if (!isUuid(id)) return response.status(400).json({ error: 'Invalid record id' })

    const result = await pool.query(
      'DELETE FROM app.analysis_records WHERE id = $1 RETURNING id',
      [id],
    )
    if (!result.rowCount) return response.status(404).json({ error: 'Analysis record not found' })
    broadcastReportChange('deleted', { id: result.rows[0].id })
    return response.status(204).send()
  } catch (error) {
    return next(error)
  }
})

app.use((error, _request, response, _next) => {
  console.error(error)
  response.status(500).json({ error: 'Internal server error' })
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
