const express = require('express');
const session = require('express-session');
const passport = require('passport');
const { Strategy } = require('passport-facebook');
const { SuperfaceClient } = require('@superfaceai/one-sdk');
import { Client} from 'instagram-graph-api';
import axios from 'axios';


require('dotenv').config();

const longLiveToken = {
  "access_token": "EAAMK352nowgBOzFMaxMSJmCQn0Jx6y2hyZChzuBagtmZBKnGUD3DEfhrsrehHNPZAIZAkZBi9AVnuK03W8g1d1uKtha2xGxJpVQFMIMVS2E4uzxP6zAlxHRtCCuHViZC0QEge1JXNAZBLRa6BgakNMK5kCFIaf8KE8U9SEJr1CKs1IBVbP2YAET8gZDZD",
  "token_type": "bearer",
  "expires_in": 5184000
};

const ACCESS_TOKEN = longLiveToken.access_token;
const PAGE_ID = "160589493784897";
const client = new Client(ACCESS_TOKEN, PAGE_ID);


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
      callbackURL: `https://cpeqah8x3a.ap-southeast-1.awsapprunner.com/auth/facebook/callback`,
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

// <5> Start authentication flow
app.get(
  '/auth/facebook',
  passport.authenticate('facebook', {
    // <6> Scopes
    // scope: ['instagram_manage_insights', 'instagram_basic'],    
    scope: ['user_profile','user_media']
  })
);

app.get('/query', passport.authenticate('facebook'), async function(req, res, next) {
  const igid = req.query['igid'];
  
  const response = await axios.get(`https://graph.facebook.com/v18.0/17841462406046553?fields=business_discovery.username(${igid})`);

  res.json(response.data);    
});

// <7> Callback handler
app.get(
  '/auth/facebook/callback',
  passport.authenticate('facebook'),
  async function (req, res, next) {
    try {
      // <8> Obtaining profiles
      const accessToken = req.user.accessToken;
      const sdkProfile = await sdk.getProfile(
        'social-media/publishing-profiles@1.0.1'
      );
      const result = await sdkProfile
        .getUseCase('GetProfilesForPublishing')
        .perform(
          {},
          {
            provider: 'instagram',
            parameters: {
              accessToken,
            },
          }
        );
      const profiles = result.unwrap();

      res.send(
        `
        <h1>Authentication succeeded</h1>
        <h2>User data</h2>
        <pre>${JSON.stringify(req.user, undefined, 2)}</pre>
        <h2>Instagram profiles</h2>
        <pre>${JSON.stringify(profiles, undefined, 2)}</pre>
        `
      );
      next();
    } catch (err) {
      next(err);
    }
  }
);

app.listen(3000, () => {
  console.log(`Listening on ${process.env.BASE_URL}`);
});
