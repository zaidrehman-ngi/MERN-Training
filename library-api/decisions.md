# Exercise 1

## Borrow Request Approval

Chosen approach:
PATCH /api/v1/borrow-requests/:id

Example:
PATCH /api/v1/borrow-requests/9

{
  "status": "approved"
}

Reason:
Approval changes the status of an existing borrow request, so PATCH is appropriate for partially updating the resource.

Why not POST /borrow-requests/9/approve:
It uses an action in the URL. A colleague could reasonably prefer this because "approve" is a clear business action and makes the endpoint easy to understand.

Why not POST /approvals:
It treats approval as a separate resource. This could be useful if approvals have their own data, history, or lifecycle, but for this system approval is currently just a status change on the borrow request.


## Borrow Request Nesting

Compared approaches:

GET /api/v1/users/5/borrow-requests

GET /api/v1/borrow-requests?userId=5

Chosen approach:
GET /api/v1/borrow-requests?userId=5

Reason:
Borrow requests need to be listed and filtered by multiple fields such as user, book, and status. Query parameters keep the endpoint flexible without creating separate nested endpoints.

When nesting wins:
Nesting is useful when the child resource is strongly scoped to one parent and the relationship is the main purpose of the request.

When query parameters win:
Query parameters are better when the same resource needs to be filtered in different ways.

Because borrow requests can be filtered by user, book, and status, query parameters are more suitable here.


## Frontend Ambiguity Review

I reviewed the endpoint table from a frontend developer's perspective. Three endpoints needed clearer descriptions.

1. GET /api/v1/books
   Changed the description to mention filtering, sorting and paging so the available query parameters are clear.

2. GET /api/v1/borrow-requests
   Changed the description to mention userId, bookId and status filters because borrow requests can be listed in different ways.

3. PATCH /api/v1/borrow-requests/:id
   Changed the description to mention approved and rejected status values so the approval flow is clear.

===============================================================================

