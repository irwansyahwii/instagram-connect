/**
 * Copyright: https://superface.ai/blog/instagram-login
 */

const express = require('express');
const session = require('express-session');
const passport = require('passport');
const { Strategy } = require('passport-facebook');
const { SuperfaceClient } = require('@superfaceai/one-sdk');

require('dotenv').config();

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
    scope: ['instagram_manage_insights', 'instagram_basic'],
  })
);

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
