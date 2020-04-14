# JWT-token-Auth-using-Express-and-Nodejs
Using JWT token for authorization and maintaining session in node js using express-session and MongoDB.

I edited some files in express so that I can add any object to "request", 
How to do this ? Here's the link I found on the web - 
https://truetocode.com/extend-express-request-and-response-typescript-declaration-merging/

#### MONGOOSE MODELS


> ./models/user.js <br />
> ./models/issuedToken.js

##### PROCESS
- (Registration) User enters the credentials to register, the password is hashed and stored in the database using mongoose driver.
- (LOGIN) When user enters the valid credentials, a token is generated having a validity period and also the issuedToken object 
is created and stored in the database, I used ttl (time-to-live) feature of mongoDB which will delete the issued token object from database
automatically when the expiry time over, so if some person manages to stole the token and if he increased its session time or something
and tries to access the protected route, eventually will fail as every time the token is verified it is also cross checked from
the database before allowing the person to access the protected route.
