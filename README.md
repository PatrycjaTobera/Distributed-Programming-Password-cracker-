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


# Create configuration files
## In folder: \Distributed-Programming-Password-cracker-\frontend-client create file .env
```bash
ASPNETCORE_ENVIRONMENT=Development
ASPNETCORE_URLS=http://+:5099;http://+:5098
PASSWORD_FILE_PATH=../data/users_passwords.txt
CENTRAL_SERVER_IP=central_server_ip
CALCULATING_SERVER_IP=compute_server_ip
```

## In folder: \Distributed-Programming-Password-cracker-\frontend-client\frontend-client create file .env
```bash
VITE_CENTRAL_SERVER_IP=http://localhost:5098
```
