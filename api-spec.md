# Exercise 1

# API Specification

## Conventions

1. Use plural resource names, such as /books and /users.
2. Use lowercase kebab-case for paths.
3. Use camelCase for JSON keys, independently of path casing.
4. Allow at most one level of nesting; use query parameters for deeper relationships.
5. Use 400 for missing or malformed request fields, 422 for valid requests with invalid field values, and 409 for conflicts with existing resources.
6. PUT replaces the complete resource and requires all book fields, while PATCH is used for partial updates.

## Corrected Endpoints

1. GET /api/v1/books
   Wrong: The path uses an action (`getAllBooks`) instead of the plural resource name `books`.

2. GET /api/v1/books
   Wrong: The resource is singular, uses an underscore, and duplicates the books list endpoint.

3. POST /api/v1/books
   Wrong: The path uses an action (`createNewBook`) instead of using the HTTP method to describe the operation.

4. DELETE /api/v1/books/12
   Wrong: It uses POST instead of DELETE, includes an action in the path, and uses an unnecessary nested structure.

5. GET /api/v1/borrow-requests?bookId=12
   Wrong: It uses an action (`getBorrowHistory`) and unnecessary nesting; the book filter should be a query parameter.

6. GET /api/v1/books?author=herbert
   Wrong: The path uses an action and an overly specific endpoint; author filtering belongs in a query parameter.

7. PATCH /api/v1/books/12
   Wrong: The path uses inconsistent casing and treats a field as a separate path instead of updating the book resource.

8. GET /api/v1/borrow-requests?status=pending
   Wrong: The pending status should be a query parameter instead of being embedded in the path.


## Endpoint Table

| method | path | what it does | who can call it |
|--------|------|--------------|-----------------|
| POST | /api/v1/users | register a new member | public |
| GET | /api/v1/users | list members | librarian, admin |
| GET | /api/v1/users/:id | read one member | self, librarian, admin |
| PATCH | /api/v1/users/:id | update some fields | self, admin |
| DELETE | /api/v1/users/:id | remove a member | admin |
| GET | /api/v1/books | list books with filtering, sorting and paging | public |
| POST | /api/v1/books | create a book | librarian, admin |
| GET | /api/v1/books/:id | read one book | public |
| PATCH | /api/v1/books/:id | update book details or available copies | librarian, admin |
| DELETE | /api/v1/books/:id | remove a book | admin |
| GET | /api/v1/borrow-requests | list borrow requests with userId, bookId and status filters | user, librarian, admin |
| POST | /api/v1/borrow-requests | create a borrow request | user |
| GET | /api/v1/borrow-requests/:id | read one borrow request | user, librarian, admin |
| PATCH | /api/v1/borrow-requests/:id | update a borrow request, including status such as approved or rejected | librarian, admin |
| POST | /api/v1/borrow-requests/:id/return | return a borrowed book | user, librarian, admin |
| POST | /api/v1/auth/login | authenticate a user | public |
| POST | /api/v1/auth/logout | log out the current user | user, librarian, admin, super admin |
| POST | /api/v1/auth/refresh | refresh an authentication token | user, librarian, admin, super admin |


### Books List Query Parameters

GET /api/v1/books accepts:
- author — filter by author
- title — filter by title
- available — filter by availability
- sort — field to sort by, such as title or year
- order — sort order: asc or desc
- page — page number
- limit — number of results per page

===============================================================================

# Exercise 2

## PART C

### Error Response Shape

All endpoints use the same error response structure:

{
  "error": "VALIDATION_ERROR",
  "message": "Some fields are invalid.",
  "details": [
    {
      "field": "title",
      "message": "Title is required."
    },
    {
      "field": "isbn",
      "message": "ISBN is not valid."
    }
  ]
}

For an expired token:

{
  "error": "TOKEN_EXPIRED",
  "message": "Your authentication token has expired.",
  "details": []
}

For an unexpected server error:

{
  "error": "INTERNAL_SERVER_ERROR",
  "message": "Something went wrong. Please try again later.",
  "details": []
}

This structure allows the frontend to identify the error type, show a clear message, and handle individual field errors separately. A bare string would not provide this structured information.

================================================================================

