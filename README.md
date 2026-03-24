## Distributed-Programming-Password-cracker-

# Install packages

```bash
dotnet add package Npgsql.EntityFrameworkCore.PostgreSQL --version 7.0.18
```

```bash
dotnet add package Microsoft.EntityFrameworkCore --version 7.0.20
```

# Run docker Central server and frontend
## In folder: \Distributed-Programming-Password-cracker-
```bash
docker compose up --build --force-recreate
```

# Run docker Compute server
## In folder: \Distributed-Programming-Password-cracker-

```bash
docker compose -f compose.calculating.yaml up --build --force-recreate
```

# Run frontend
## In folder: \Distributed-Programming-Password-cracker-\frontend-client
```bash
npm install && npm run dev
```