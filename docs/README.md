# GitHub OAuth App for Decap CMS

This application provides a self-hosted OAuth 2.0 authentication solution for [Decap CMS](https://decapcms.org/) (formerly Netlify CMS) using GitHub as the identity provider. It is designed to verify repository-level permissions, ensuring users have appropriate access before granting a token to the CMS.

This project serves as a secure alternative to third-party OAuth services, giving you full control over the authentication flow.

## Features

- Secure GitHub OAuth 2.0 flow
- Repository-level permission verification (write, admin, maintain)
- CSRF protection using state parameter
- CORS protection, configurable for your frontend domain
- Rate limiting to prevent abuse
- Stateless authentication
- Designed for popup-based integration with Decap CMS
- Dockerized for easy deployment

## Project Structure

(A brief overview of the main directories and their purpose can be added here, or link to a more detailed structure in `docs/`)

## Prerequisites

- Node.js (LTS version recommended)
- Docker and Docker Compose
- A registered GitHub OAuth Application
- A domain/subdomain for hosting the OAuth app (e.g., `oauth.yourdomain.com`)
- SSL certificate for the OAuth app domain

## Configuration

Setting up this application involves two main parts: configuring your OAuth App on GitHub and setting environment variables for this application via an `.env` file.

### 1. GitHub OAuth App Settings

First, you need to register a new OAuth application on GitHub:

1. Go to GitHub Developer settings: [https://github.com/settings/applications/new](https://github.com/settings/applications/new)
2. Fill in the application details:
   - **Application Name:** Choose a descriptive name, e.g., "My Site Decap CMS Auth".
   - **Homepage URL:** The primary URL where your OAuth service will be running. This is the base URL of _this_ OAuth application.
     - _Example:_ `https://oauth.yourdomain.com`
   - **Authorization callback URL:** This is the most critical setting. It's the exact URL GitHub will redirect users back to after they authorize your app. It must point to the `/callback` endpoint of this OAuth application.
     - _Example:_ `https://oauth.yourdomain.com/callback`
3. After creating the app, GitHub will provide you with a **Client ID** and generate a **Client Secret**. You will need these for your `.env` file.

### 2. Environment Variables (`.env` file)

Create a `.env` file in the project root by copying the `.env.example` file:

```bash
cp .env.example .env
```

Then, update the `.env` file with the following values:

- **`NODE_ENV`**: Set to `production` for live deployments, or `development` for local testing.
- **`PORT`**: The port this OAuth application will run on (e.g., `3000`).
- **`HOST`**: The host address this application will bind to (e.g., `0.0.0.0` for Docker deployments).

- **`GITHUB_CLIENT_ID`**: The Client ID obtained from your GitHub OAuth App settings.
- **`GITHUB_CLIENT_SECRET`**: The Client Secret obtained from your GitHub OAuth App settings.
- **`GITHUB_CALLBACK_URL`**: The Authorization callback URL. **This must exactly match the "Authorization callback URL" you set in your GitHub OAuth App settings.**
  - _Example:_ `https://oauth.yourdomain.com/callback`
- **`GITHUB_SCOPE`**: The permissions your app requests. `repo` is typically needed for Decap CMS to access repository content. You can refine this (e.g., `public_repo` if only public repos are managed).
- **`GITHUB_REPO`**: The specific repository this OAuth app will authorize access to for Decap CMS (e.g., `your-username/your-jekyll-site`).

- **`FRONTEND_URL`**: **This is specific to this OAuth application's CORS policy and is NOT a GitHub setting.** It's the base URL of your main website where Decap CMS is accessed from (e.g., your Jekyll site's domain). This allows Decap CMS (running on your main site) to make requests to this OAuth service.
  - _Example:_ `https://www.yourmainjekyllsite.com`
- **`SESSION_SECRET`**: A long, unique, and random string used for securing session data (even if the app is largely stateless, some underlying libraries or future features might use it).

  **Generating a Secure `SESSION_SECRET`:**
  It's crucial to use a cryptographically strong random string. Here are a few methods:

  1. **Using OpenSSL (Recommended for command-line):**

      ```bash
      # Generates a 64-character hex string (32 bytes)
      openssl rand -hex 32
      
      # For a stronger 128-character hex string (64 bytes):
      # openssl rand -hex 64
      ```

  2. **Using Node.js `crypto` module:**

      Run this in your Node.js REPL or a script:

      ```javascript
      // require('crypto').randomBytes(32).toString('hex');
      // For 64 bytes:
      // require('crypto').randomBytes(64).toString('hex');
      ```

      To run directly in your terminal (if Node.js is installed):

      ```bash
      node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
      ```

  3. **Using a Password Manager:**

      Most password managers have a built-in secure password generator. Configure it to generate a long string (e.g., 32-64 characters) with a mix of character types if possible, though a long hex string from the methods above is excellent.

- **`RATE_LIMIT_REQUESTS`**, **`RATE_LIMIT_WINDOW_MINUTES`**: Optional settings for rate limiting; defaults are usually fine.

Refer to the `.env.example` file for comments on each variable.

## Build & Run with Docker

To build the Docker image:

```bash
docker build -t your-oauth-app-name .
```

To run using Docker Compose (recommended for managing environment variables and ports):

```bash
docker-compose up -d
```

## Deployment

This application is designed to be deployed using Docker on a VPS, with Nginx as a reverse proxy handling SSL termination.

1. Set up your VPS and install Docker and Docker Compose.
2. Configure your DNS for `oauth.yourdomain.com` to point to your VPS IP.
3. Obtain SSL certificates (e.g., using Let's Encrypt / Certbot).
4. Configure Nginx as a reverse proxy. An example configuration is provided in `nginx/nginx-server-block.conf`.
5. Place your `.env` file on the server where Docker Compose can access it.
6. Deploy the application using `docker-compose up -d`.

## Decap CMS Integration

Update your Decap CMS `config.yml`:

```yaml
backend:
  name: github
  repo: your-org/your-repo-name # e.g., myuser/my-jekyll-site
  branch: main # or your default branch
  base_url: https://oauth.yourdomain.com # Your OAuth app's URL
  auth_endpoint: auth # The path to your auth endpoint
```

## License

[MIT License](LICENSE)
