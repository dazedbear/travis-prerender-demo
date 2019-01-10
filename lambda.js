/**
 * AWS Lambda to trigger travis build manually
 */
const https = require('https');
const querystring = require('querystring');

exports.handler = (event, context, callback) => {
  const repoSlug = 'dazedbear';
  const repoName = 'travis-prerender-demo';
  const payload = querystring.stringify({
    request: {
      branch: "master"
    }
  })
  const options = {
    hostname: 'api.travis-ci.org',
    path: `/repo/${repoSlug}%2F${repoName}/requests`,
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "Travis-API-Version": 3,
      "Authorization": `token ${process.env.TRAVIS_CI_TOKEN}`,
      'Content-Length': Buffer.byteLength(payload)
    }
  }
  
  const trigger = https
    .request(options, res => {
      console.log('statusCode:', res.statusCode);
      console.log('headers:', res.headers);

      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(data.toString());
        if(res.statusCode !== 200) {
            callback(`Trigger travis to build ${repoSlug}/${repoName} error.`)
            return;
        }
        
        callback(null, `Trigger travis to build ${repoSlug}/${repoName} success.`)
      });
    })
    .on('error', e => {
        console.error(e.toString())
        callback(`Trigger travis to build ${repoSlug}/${repoName} error.`)
    });
  trigger.write(payload);
  trigger.end();
}
