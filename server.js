const express = require('express');
const session = require('express-session');
const passport = require('passport');
const { Strategy } = require('passport-facebook');
const { SuperfaceClient } = require('@superfaceai/one-sdk');
const axios = require('axios');




require('dotenv').config();

const longLiveToken = {
  "access_token": "EAAMK352nowgBOzFMaxMSJmCQn0Jx6y2hyZChzuBagtmZBKnGUD3DEfhrsrehHNPZAIZAkZBi9AVnuK03W8g1d1uKtha2xGxJpVQFMIMVS2E4uzxP6zAlxHRtCCuHViZC0QEge1JXNAZBLRa6BgakNMK5kCFIaf8KE8U9SEJr1CKs1IBVbP2YAET8gZDZD",
  "token_type": "bearer",
  "expires_in": 5184000
};

const sdk = new SuperfaceClient();

// <1> Serialization and deserialization
passport.serializeUser(function (user, done) {
  done(null, user);
});
passport.deserializeUser(function (obj, done) {
  done(null, obj);
});

// Use the Facebook strategy within Passport
passport.use(
  // <2> Strategy initialization
  new Strategy(
    {
      clientID: process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
      callbackURL: `${process.env.BASE_URL}/auth/facebook/callback`//`https://cpeqah8x3a.ap-southeast-1.awsapprunner.com/auth/facebook/callback`,
    },
    // <3> Verify callback
    (accessToken, refreshToken, profile, done) => {
      console.log('Success!', { accessToken, profile });
      return done(null, { profile, accessToken });
    }
  )
);

const app = express();

// <4> Session middleware initialization
app.use(
  session({ secret: 'keyboard cat', resave: false, saveUninitialized: true })
);
app.use(passport.initialize());

app.get('/', async function(req, res, next) {
  res.send('<h2>Please wait...</h2>');
});

// <5> Start authentication flow
app.get(
  '/auth/facebook',
  passport.authenticate('facebook', {
    // <6> Scopes
    // scope: ['instagram_manage_insights', 'instagram_basic'],    
    scope: ['pages_show_list', 'instagram_manage_insights', 'pages_read_engagement', 'business_management', 'ads_management', 'instagram_basic', 'instagram_content_publish']
    // scope: ['user_profile','user_media']
  })
);
const irwansyah_idn_token =  "EAAMK352nowgBO3ZBRIuZCdZBvzrO6nZB52bK9ZCAHSvaaT3ZB6SG1oIpZBUaghqUjMfqkUM1HQ5BSv7aanKp5AwsiAJjaRzPcfIbpoceeR8U7Uo0prbGvEdAgnwZBZBk0GKXxh10RtJmR0dW8mpIzyD5JizpMuxQKkHQMozzZCymWhKSD0Na4XMvSBoSAMS79b0iai562ZAg8V7N9uoVPdJQWZBgzf7Hwq9ekZBYKRmQ1LnHMjpd3Kn7mEFCGbbV1C1jH";

app.get('/query', async function(req, res, next) {
  const igid = req.query['igid'];
  
  let response = null;
  try {
    response = await axios.get(`https://graph.facebook.com/v18.0/me/accounts&access_token=${irwansyah_idn_token}`);
    //response = await axios.get(`https://graph.facebook.com/v18.0/147608145104866?fields=instagram_business_account&access_token=${irwansyah_idn_token}`);
    //https://graph.facebook.com/v18.0/17841462406046553?fields=business_discovery.username(${igid}){followers_count,media_count}&access_token=${longLiveToken.access_token}`);

    res.json(response.data);    
      
  } catch (error) {
    if(error.response && error.response.data){
      res.json(error.response.data);
    }else{
      res.json({error:error});
    }
    
    // res.json(response.data);
  }
});

// <7> Callback handler
app.get(
  '/auth/facebook/callback',
  passport.authenticate('facebook'),
  async function (req, res, next) {
    try {
      // <8> Obtaining profiles
      const accessToken = req.user.accessToken;

      // res.redirect(`${process.env.BASE_URL}?access_token=${accessToken}`);
      res.redirect(`ice://ice-connect?access_token=${accessToken}`);

      // const sdkProfile = await sdk.getProfile(
      //   'social-media/publishing-profiles@1.0.1'
      // );
      // const result = await sdkProfile
      //   .getUseCase('GetProfilesForPublishing')
      //   .perform(
      //     {},
      //     {
      //       provider: 'instagram',
      //       parameters: {
      //         accessToken,
      //       },
      //     }
      //   );
      // const profiles = result.unwrap();

      // res.send(
      //   `
      //   <h1>Authentication succeeded</h1>
      //   <h2>User data</h2>
      //   <pre>${JSON.stringify(req.user, undefined, 2)}</pre>
      //   <h2>Instagram profiles</h2>
      //   <pre>${JSON.stringify(profiles, undefined, 2)}</pre>
      //   `
      // );
      next();
    } catch (err) {
      next(err);
    }
  }
);

app.listen(3000, () => {
  console.log(`Listening on ${process.env.BASE_URL}`);
});
