const response = await fetch('http://127.0.0.1:3000/api/health')

if (!response.ok) {
  process.exitCode = 1
}
