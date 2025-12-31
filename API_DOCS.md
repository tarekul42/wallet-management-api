# API Documentation

This document provides a comprehensive guide to the Wallet Management API, designed to help frontend developers integrate with the backend services efficiently.

## Base URL

All API endpoints are prefixed with the following base URL:

`/api/v1`

## Authentication

This API uses JSON Web Tokens (JWT) for authentication. Authentication is managed through `accessToken` and `refreshToken` which are sent as `httpOnly` cookies.

-   `accessToken`: This token must be included in the header of every request to secured endpoints. It has a short lifespan and is used to verify the user's identity for each API call.
-   `refreshToken`: This token is used to obtain a new `accessToken` once it expires. This process is handled by the `/auth/refresh-token` endpoint.

## Endpoints

Below is a detailed list of all available API endpoints, categorized by module.

---

### Auth

This module handles user authentication, including registration, login, logout, and password management.

#### 1. Register a New User

-   **Endpoint:** `POST /auth/register`
-   **Description:** Creates a new user account. An email is sent for verification.
-   **Authentication:** None
-   **Request Body:**

    ```json
    {
      "name": "John Doe",
      "email": "john.doe@example.com",
      "password": "Password123!",
      "confirmPassword": "Password123!",
      "phone": "01712345678",
      "address": "123 Main St, Dhaka",
      "nid": "1234567890",
      "role": "USER"
    }
    ```

-   **Response:**

    -   **Success (201 CREATED):**

        ```json
        {
          "success": true,
          "statusCode": 201,
          "message": "User registered successfully. Please check your email to verify your account.",
          "data": {
            "name": "John Doe",
            "email": "john.doe@example.com",
            "role": "USER",
            ...
          }
        }
        ```

#### 2. Login

-   **Endpoint:** `POST /auth/login`
-   **Description:** Authenticates a user and returns JWT tokens in cookies.
-   **Authentication:** None
-   **Request Body:**

    ```json
    {
      "email": "john.doe@example.com",
      "password": "Password123!"
    }
    ```

-   **Response:**

    -   **Success (200 OK):**
        -   `accessToken` and `refreshToken` are set as `httpOnly` cookies.
        ```json
        {
          "success": true,
          "statusCode": 200,
          "message": "User Logged In Successfully",
          "data": {
            "accessToken": "...",
            "refreshToken": "..."
          }
        }
        ```

#### 3. Logout

-   **Endpoint:** `POST /auth/logout`
-   **Description:** Logs out the user by clearing the JWT cookies.
-   **Authentication:** `USER`, `AGENT`, `ADMIN`, `SUPER_ADMIN`
-   **Response:**

    -   **Success (200 OK):**

        ```json
        {
          "statusCode": 200,
          "success": true,
          "message": "Logged out successfully.",
          "data": null
        }
        ```

#### 4. Refresh Token

-   **Endpoint:** `POST /auth/refresh-token`
-   **Description:** Issues a new `accessToken`.
-   **Authentication:** Requires `refreshToken` in cookie.
-   **Response:**

    -   **Success (200 OK):**
        -   A new `accessToken` is set as an `httpOnly` cookie.
        ```json
        {
          "success": true,
          "statusCode": 200,
          "message": "New Access Token Retrived Successfully",
          "data": {
            "accessToken": "..."
          }
        }
        ```

#### 5. Verify Email

- **Endpoint:** `POST /auth/verify-email`
- **Description:** Verifies a user's email address using a token sent to them.
- **Authentication:** None
- **Request Body:**
  ```json
  {
    "token": "verification_token_from_email"
  }
  ```
- **Response (Success):**
  ```json
  {
    "statusCode": 200,
    "success": true,
    "message": "Email verified successfully",
    "data": null
  }
  ```

#### 6. Forgot Password

- **Endpoint:** `POST /auth/forgot-password`
- **Description:** Initiates the password reset process by sending a reset token to the user's email.
- **Authentication:** None
- **Request Body:**
  ```json
  {
    "email": "user@example.com"
  }
  ```
- **Response (Success):**
  ```json
  {
    "statusCode": 200,
    "success": true,
    "message": "Password reset email sent",
    "data": null
  }
  ```

#### 7. Reset Password

- **Endpoint:** `POST /auth/reset-password`
- **Description:** Resets the user's password using a valid reset token.
- **Authentication:** None
- **Request Body:**
  ```json
  {
    "token": "reset_token_from_email",
    "newPassword": "newStrongPassword123!"
  }
  ```
- **Response (Success):**
  ```json
  {
    "statusCode": 200,
    "success": true,
    "message": "Password reset successfully",
    "data": null
  }
  ```
---

### Users

This module manages user profiles and administrative actions.

#### 1. Get My Profile

-   **Endpoint:** `GET /users/me`
-   **Description:** Retrieves the profile of the currently logged-in user.
-   **Authentication:** `USER`, `AGENT`, `ADMIN`, `SUPER_ADMIN`
-   **Response:**

    -   **Success (200 OK):**

        ```json
        {
          "statusCode": 200,
          "success": true,
          "message": "Profile fetched successfully",
          "data": {
            "_id": "...",
            "name": "John Doe",
            "email": "john.doe@example.com",
            ...
          }
        }
        ```

#### 2. Update My Profile

-   **Endpoint:** `PATCH /users/me`
-   **Description:** Updates the profile of the currently logged-in user.
-   **Authentication:** `USER`, `AGENT`, `ADMIN`, `SUPER_ADMIN`
-   **Request Body:**

    ```json
    {
      "name": "Johnathan Doe",
      "phone": "01812345678"
    }
    ```

-   **Response:**

    -   **Success (200 OK):**

        ```json
        {
          "statusCode": 200,
          "success": true,
          "message": "Profile updated successfully",
          "data": {
            "_id": "...",
            "name": "Johnathan Doe",
            "phone": "01812345678",
            ...
          }
        }
        ```
        
#### 3. Update Password

- **Endpoint:** `PATCH /users/me/update-password`
- **Description:** Allows a logged-in user to update their own password.
- **Authentication:** `USER`, `AGENT`, `ADMIN`, `SUPER_ADMIN`
- **Request Body:**
  ```json
  {
    "oldPassword": "currentPassword123!",
    "newPassword": "newStrongPassword456!",
    "confirmPassword": "newStrongPassword456!"
  }
  ```
- **Response (Success):**
  ```json
  {
    "statusCode": 200,
    "success": true,
    "message": "Password updated successfully",
    "data": null
  }
  ```

#### 4. Create Admin

- **Endpoint:** `POST /users/create-admin`
- **Description:** Creates a new user with an `ADMIN` role.
- **Authentication:** `SUPER_ADMIN`
- **Request Body:**
  ```json
  {
    "name": "New Admin",
    "email": "admin@example.com",
    "password": "strongPassword123!",
    "role": "ADMIN"
  }
  ```
- **Response (Success):**
  ```json
  {
    "statusCode": 201,
    "success": true,
    "message": "Admin created successfully",
    "data": { ... }
  }
  ```

#### 5. Get All Users

- **Endpoint:** `GET /users`
- **Description:** Retrieves a list of all users.
- **Authentication:** `ADMIN`, `SUPER_ADMIN`
- **Response (Success):**
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "Users retrieved successfully",
    "data": [ ... ]
  }
  ```

#### 6. Block/Unblock User

- **Endpoint:** `PATCH /users/:id/block` or `PATCH /users/:id/unblock`
- **Description:** Blocks or unblocks a specific user.
- **Authentication:** `ADMIN`, `SUPER_ADMIN`
- **Response (Success):**
  ```json
  {
    "statusCode": 200,
    "success": true,
    "message": "User blocked/unblocked successfully",
    "data": { ... }
  }
  ```

#### 7. Agent Approval

- **Endpoint:** `PATCH /users/:id/approval`
- **Description:** Approves or rejects an agent's application.
- **Authentication:** `ADMIN`, `SUPER_ADMIN`
- **Request Body:**
  ```json
  {
    "approvalStatus": "APPROVED",
    "commissionRate": 0.05
  }
  ```
- **Response (Success):**
  ```json
  {
    "statusCode": 200,
    "success": true,
    "message": "Agent approved successfully",
    "data": { ... }
  }
  ```

#### 8. Suspend Agent

- **Endpoint:** `PATCH /users/:id/suspend`
- **Description:** Suspends a specific agent.
- **Authentication:** `ADMIN`, `SUPER_ADMIN`
- **Request Body:**
  ```json
  {
    "status": "suspended"
  }
  ```
- **Response (Success):**
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "Agent has been successfully suspended.",
    "data": { ... }
  }
  ```
---

### Wallets

This module manages user wallets.

#### 1. Get My Wallet

-   **Endpoint:** `GET /wallets/me`
-   **Description:** Retrieves the wallet of the currently logged-in user.
-   **Authentication:** `USER`, `AGENT`, `SUPER_ADMIN`
-   **Response:**

    -   **Success (200 OK):**

        ```json
        {
          "success": true,
          "statusCode": 200,
          "message": "Wallet retrieved successfully",
          "data": {
            "_id": "...",
            "owner": "...",
            "balance": 1000,
            "status": "ACTIVE"
          }
        }
        ```

#### 2. Get All Wallets

- **Endpoint:** `GET /wallets`
- **Description:** Retrieves all wallets in the system.
- **Authentication:** `ADMIN`, `SUPER_ADMIN`
- **Response (Success):**
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "Wallets retrieved successfully",
    "data": [ ... ]
  }
  ```

#### 3. Get Single Wallet

- **Endpoint:** `GET /wallets/:id`
- **Description:** Retrieves a specific wallet by its ID.
- **Authentication:** `ADMIN`, `SUPER_ADMIN`
- **Response (Success):**
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "Wallet retrieved successfully",
    "data": { ... }
  }
  ```

#### 4. Block/Unblock Wallet

- **Endpoint:** `PATCH /wallets/:id/block` or `PATCH /wallets/:id/unblock`
- **Description:** Blocks or unblocks a specific wallet.
- **Authentication:** `ADMIN`, `SUPER_ADMIN`
- **Response (Success):**
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "Wallet blocked/unblocked successfully",
    "data": { ... }
  }
  ```
---

### Transactions

This module handles all financial transactions.

#### 1. Send Money

-   **Endpoint:** `POST /transactions/send-money`
-   **Description:** Sends money from the logged-in user's wallet to another user.
-   **Authentication:** `USER`
-   **Request Body:**

    ```json
    {
      "amount": 100,
      "receiverEmail": "jane.doe@example.com",
      "description": "Payment for services"
    }
    ```

-   **Response:**

    -   **Success (200 OK):**

        ```json
        {
          "success": true,
          "statusCode": 200,
          "message": "Money sent successfully",
          "data": null
        }
        ```
        
#### 2. Add Money (Cash In)

- **Endpoint:** `POST /transactions/add-money`
- **Description:** Adds money to a user's wallet. Can be initiated by a `USER` or an `AGENT`.
- **Authentication:** `USER`, `AGENT`
- **Request Body:**
  ```json
  {
    "amount": 500,
    "receiverId": "user_id_to_credit" // Optional, for agents adding money to a user
  }
  ```
- **Response (Success):**
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "Money added successfully",
    "data": { ... }
  }
  ```

#### 3. Withdraw Money

- **Endpoint:** `POST /transactions/withdraw-money`
- **Description:** Withdraws money from a user's wallet.
- **Authentication:** `USER`, `AGENT`
- **Request Body:**
  ```json
  {
    "amount": 200,
    "fromId": "user_id_to_debit" // Optional, for agents withdrawing from a user
  }
  ```
- **Response (Success):**
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "Withdrawal successful",
    "data": null
  }
  ```

#### 4. View Transaction History

- **Endpoint:** `GET /transactions/history`
- **Description:** Retrieves the transaction history for the logged-in user.
- **Authentication:** `USER`, `AGENT`, `ADMIN`
- **Response (Success):**
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "Transaction history retrieved successfully",
    "data": [ ... ]
  }
  ```

#### 5. Get Commission History

- **Endpoint:** `GET /transactions/get-commission-history`
- **Description:** Retrieves commission history for an agent.
- **Authentication:** `AGENT`, `ADMIN`
- **Response (Success):**
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "Commission history retrieved successfully",
    "data": [ ... ]
  }
  ```
---

### System Config

This module manages system-wide configurations.

#### 1. Get System Configuration

-   **Endpoint:** `GET /system-config`
-   **Description:** Retrieves the current system configuration.
-   **Authentication:** Public
-   **Response:**

    -   **Success (200 OK):**

        ```json
        {
          "statusCode": 200,
          "success": true,
          "message": "System configuration retrieved successfully",
          "data": {
            "sendMoneyFee": 0.01,
            "cashInFee": 0,
            "withdrawFee": 0.015,
            ...
          }
        }
        ```

#### 2. Update System Configuration

-   **Endpoint:** `PATCH /system-config`
-   **Description:** Updates the system configuration.
-   **Authentication:** `SUPER_ADMIN`, `ADMIN`
-   **Request Body:**

    ```json
    {
      "sendMoneyFee": 0.015,
      "dailyLimit": 50000
    }
    ```

-   **Response:**

    -   **Success (200 OK):**

        ```json
        {
          "statusCode": 200,
          "success": true,
          "message": "System configuration updated successfully",
          "data": {
            "sendMoneyFee": 0.015,
            "dailyLimit": 50000,
            ...
          }
        }
        ```