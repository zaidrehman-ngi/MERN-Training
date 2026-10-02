# Exercise 3

### JWT Storage — After Testing

I previously decided to store the JWT in an `httpOnly`, `Secure`, `SameSite` cookie instead of `localStorage` because `localStorage` makes the token accessible to JavaScript and therefore more exposed to XSS-based token theft, while cookies can reduce this risk when properly configured with CSRF protection.

After implementing and testing the cookie, I would keep the same decision. The actual `Set-Cookie` header confirmed that `HttpOnly`, `SameSite=Strict`, and `Max-Age` can be applied as expected. The cookie approach still requires appropriate HTTPS and CSRF protection in a production environment.
