import { FastifyInstance } from "fastify";
import { config } from "../config.js";

/**
 * Represents a GitHub user, typically part of a permission response.
 * Additional fields like `avatar_url` or `html_url` can be added if needed.
 */
interface GitHubUser {
  login: string;
  id: number;
}

/**
 * Represents the permission level of a user for a specific repository.
 */
interface GitHubUserPermission {
  /** The permission level (e.g., 'admin', 'write', 'read'). */
  permission: "admin" | "write" | "read" | "none";
  /** The name of the role associated with the permission. */
  role_name: string;
  /** The user to whom the permission applies. */
  user: GitHubUser;
}

/**
 * Verifies if a given user has sufficient permissions (admin, write, or maintain)
 * for the configured GitHub repository.
 *
 * It fetches the user's permission level from the GitHub API endpoint:
 * `GET /repos/{owner}/{repo}/collaborators/{username}/permission`.
 *
 * The 'maintain' permission is included as it's a valid level for organization repositories
 * granting write-like access.
 *
 * @param {string} accessToken - The GitHub OAuth access token for the user.
 * @param {string} username - The GitHub username to check permissions for.
 * @param {FastifyInstance["log"]} logger - The Fastify logger instance for logging.
 * @returns {Promise<boolean>} True if the user has admin, write, or maintain permissions, false otherwise.
 *                               Returns false if the user is not a collaborator (404) or on other errors.
 * @throws {Error} If GITHUB_REPO format is invalid or for non-404 API errors.
 */
export const verifyUserPermission = async (
  accessToken: string,
  username: string,
  logger: FastifyInstance["log"],
): Promise<boolean> => {
  const { repo } = config.github;
  if (!repo.includes("/")) {
    throw new Error("Invalid GITHUB_REPO format. Expected owner/repo.");
  }
  const [owner, repoName] = repo.split("/");

  const url = `https://api.github.com/repos/${owner}/${repoName}/collaborators/${username}/permission`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `token ${accessToken}`,
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "DecapCMS-GitHub-OAuth-App",
      },
    });

    if (!response.ok) {
      const errorBody = await response.text();
      logger.error(
        { status: response.status, url, errorBody, username },
        `GitHub API error checking permission for user ${username} on repo ${owner}/${repoName}`,
      );
      if (response.status === 404) {
        return false;
      }
      throw new Error(
        `Failed to verify user permission. Status: ${response.status}`,
      );
    }

    const data = (await response.json()) as GitHubUserPermission;

    const hasWritePermission = ["admin", "write", "maintain"].includes(
      data.permission,
    );

    logger.info(
      {
        username,
        repo: `${owner}/${repoName}`,
        permission: data.permission,
        hasWritePermission,
      },
      `User permission check result for ${username}`,
    );
    return hasWritePermission;
  } catch (error: unknown) {
    let message = "Unknown error during permission verification";
    if (error instanceof Error) {
      message = error.message;
    } else if (typeof error === "string") {
      message = error;
    }
    logger.error(
      { error: message, username, repo: `${owner}/${repoName}` },
      "Error verifying GitHub user permission",
    );
    return false;
  }
};

/**
 * Represents the basic profile information for a GitHub user.
 * Can be extended with more fields from the GitHub API user response as needed.
 */
interface GitHubUserProfile {
  login: string;
  id: number;
}

/**
 * Fetches the authenticated GitHub user's profile information.
 *
 * Uses the GitHub API endpoint: `GET /user`.
 *
 * @param {string} accessToken - The GitHub OAuth access token.
 * @param {FastifyInstance["log"]} logger - The Fastify logger instance for logging.
 * @returns {Promise<GitHubUserProfile | null>} The user's profile information, or null on error.
 */
export const getGitHubUser = async (
  accessToken: string,
  logger: FastifyInstance["log"],
): Promise<GitHubUserProfile | null> => {
  const url = "https://api.github.com/user";
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `token ${accessToken}`,
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "DecapCMS-GitHub-OAuth-App",
      },
    });

    if (!response.ok) {
      const errorBody = await response.text();
      logger.error(
        { status: response.status, url, errorBody },
        `GitHub API error fetching user profile`,
      );
      return null;
    }
    const userProfile = (await response.json()) as GitHubUserProfile;
    logger.info(
      { userId: userProfile.id, login: userProfile.login },
      "Successfully fetched GitHub user profile",
    );
    return userProfile;
  } catch (error: unknown) {
    let message = "Unknown error during user profile fetch";
    if (error instanceof Error) {
      message = error.message;
    } else if (typeof error === "string") {
      message = error;
    }
    logger.error({ error: message }, "Error fetching GitHub user profile");
    return null;
  }
};
