require('dotenv').config();
const passport = require('passport');
const GitLabStrategy = require('passport-gitlab2').Strategy;
const express = require('express');
const session = require("express-session");
const bodyParser = require("body-parser");
const mime = require('mime-types');

const app = express();

app.use(express.static("public"));
app.use(session({ secret: "cats" }));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(passport.initialize());
app.use(passport.session());

const got = require('got').extend({
    headers: {
        "User-Agent": "gitlab-artifacts-browser/" + (process.env.APP_VERSION || 'dev')
    }
});
const port = process.env.PORT || 3000;

app.use((req, res, next) => {
    res.set('Server', 'gitlab-artifacts-browser ' + (process.env.APP_VERSION || 'dev'))
    next();
});

app.get('/', (req, res) => {
    res.json({"message": "nothing to see here"});
});

passport.serializeUser(function(user, done) {
    done(null, user);
});

passport.deserializeUser(function(user, done) {
    done(null, user);
});

passport.use(new GitLabStrategy({
        clientID: process.env.GITLAB_OAUTH_APPLICATION_ID,
        clientSecret: process.env.GITLAB_OAUTH_APPLICATION_SECRET,
        callbackURL: process.env.GITLAB_OAUTH_REDIRECT_URI,
        baseURL: process.env.GITLAB_URL
    },
    function(accessToken, refreshToken, profile, cb) {
    console.log({accessToken, refreshToken, profile});
        cb(false, {profile, accessToken, refreshToken});
    }
));

storeReturnToInSession = (req, res, next) => {
    if (req.session && req.session.passport) {
        next();
    } else {
        passport.authenticate('gitlab', {
            state: Buffer.from(JSON.stringify({ returnTo: req.path })).toString('base64'),
            scope: 'api'
        })(req, res, next);
    }
};

app.get('/auth/gitlab', passport.authenticate('gitlab', {scope: 'api'}));

app.get('/auth/gitlab/callback',
    passport.authenticate('gitlab', {
        failureRedirect: '/auth/gitlab',
        scope: 'api'
    }),
    function(req, res) {
        if (!req.query.state) {
            return res.redirect('/');
        }
        let {returnTo} = JSON.parse(Buffer.from(req.query.state, 'base64').toString('ascii'));

        if (returnTo) {
            res.redirect(returnTo);
        } else {
            res.json('/');
        }
    });


// namespace/:repo/:branch/:job/:path
app.get(/^\/branch-artifacts\/(.*)$/, storeReturnToInSession, async (req, res) => {
    let urlParts = req.path.split('/');
    urlParts.shift(); // space
    urlParts.shift(); // branch-artifacts
    let namespace = urlParts.shift();
    let project = urlParts.shift();
    let branch = urlParts.shift();
    let job = urlParts.shift();
    let path = urlParts.join("/");

    try {
        // turn /tester/my-test/-/jobs/5/artifacts/file/static/index.html
        // into /api/v4/projects/tester%2Fmy-test/jobs/5/artifacts/static/index.html

        // replace /-/ with / -> /tester/my-test/jobs/5/artifacts/file/static/index.html
        // replace /artifacts/file/ with /artifacts/ -> /tester/my-test/jobs/5/artifacts/static/index.html
        // replace second / with %2F -> /tester%2Fmy-test/jobs/5/artifacts/static/index.html
        //
        let requestPath = encodeURIComponent(namespace + "/" + project) + "/jobs/artifacts/" + encodeURIComponent(branch) + "/raw/" + path + "?job=" + encodeURIComponent(job);
        console.log('requestPath', requestPath);
        let response = await got.get(process.env.GITLAB_URL + "/api/v4/projects/" + requestPath, {
            headers: {
                "Authorization": "Bearer " + req.session.passport.user.accessToken
            }
        }).then((response) => {
            res.set("content-type", response.headers["content-type"]);
            res.send(response.body);
        }, (error) => {
            res.json({
                "error": error
            });
        });
    } catch (error) {
        res.json(error);
    }
});

// namespace/:repo/-/jobs/:jobId/artifacts/file/:path
app.get(/^(.*)$/, storeReturnToInSession, async (req, res) => {
    let urlParts = req.path.split('/');
    urlParts.shift(); // space
    let namespace = urlParts.shift();
    let project = urlParts.shift();
    let branch = urlParts.shift();
    let job = urlParts.shift();
    let path = urlParts.join("/");

    try {
        // turn /tester/my-test/-/jobs/5/artifacts/file/static/index.html
        // into /api/v4/projects/tester%2Fmy-test/jobs/5/artifacts/static/index.html

        let requestPath = req.path;
        // replace /-/ with / -> /tester/my-test/jobs/5/artifacts/file/static/index.html
        requestPath = requestPath.replace('/-/', '/')

        // replace /artifacts/file/ with /artifacts/ -> /tester/my-test/jobs/5/artifacts/static/index.html
        requestPath = requestPath.replace('/artifacts/file/', '/artifacts/')

        // replace second / with %2F -> /tester%2Fmy-test/jobs/5/artifacts/static/index.html
        requestPath = requestPath.replace(/^(\/[^\/]+)(\/)(.+$)/g, '$1' + encodeURIComponent('/') + '$3');

        console.log('requestPath', process.env.GITLAB_URL + "api/v4/projects/" + requestPath);
        //
        let response = await got.get(process.env.GITLAB_URL + "api/v4/projects/" + requestPath, {
            headers: {
                "Authorization": "Bearer " + req.session.passport.user.accessToken
            }
        }).then((response) => {
            res.set("content-type", mime.lookup(response.url) || response.headers["content-type"]);
            res.send(response.body);
        }, (error) => {
            res.json({
                "error": error
            });
        });
    } catch (error) {
        res.json(error);
    }
});

app.listen(port,  '0.0.0.0', () => console.log(`Listening on port ${port}!`));
