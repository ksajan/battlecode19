const cluster = require('cluster');
const numCPUs = require('os').cpus().length;

const Coldstuff = require('./runtime');
const Coldbrew = Coldstuff.Coldbrew;

const Storage = require('@google-cloud/storage');
const projectId = 'battlecode18';

const storage = new Storage({
    projectId: projectId
});

const bucket = storage.bucket('battlehack');

const pgp = require('pg-promise')();

const cn = {
    host: process.env.DB_HOST,
    port: 5432,
    database: 'battlecode',
    user: 'battlecode',
    password: process.env.DB_PASS
};

const db = pgp(cn);

const CHESS_INITIAL = 100;
const CHESS_EXTRA = 20;

const queue = `
WITH t as (
    SELECT s.id as id, s.red_team_id as red_id, s.blue_team_id as blue_id,
           r.code as red, b.code as blue
    FROM api_scrimmage as s
    INNER JOIN api_team r ON r.id=s.red_team_id
    INNER JOIN api_team b ON b.id=s.blue_team_id
    WHERE s.status = 'queued' ORDER BY id LIMIT 1
)
UPDATE api_scrimmage SET status = 'running'
FROM t WHERE api_scrimmage.id = (
    SELECT id FROM api_scrimmage WHERE status = 'queued'
    ORDER BY id LIMIT 1
) RETURNING t.id as id, t.red_id as red_id, t.blue_id as blue_id, t.red as red, t.blue as blue;
`

const end_match = `
UPDATE api_scrimmage SET status = $1, replay_id = $2 WHERE id = $3;
`


function playGame() {
    db.one(queue).then(function(scrimmage) {
        console.log(`[Worker ${process.pid}] Running match ${scrimmage.id}`);
        var seed = Math.floor(10000*Math.random());
        let c = new Coldbrew(null, seed, scrimmage.red, scrimmage.blue, CHESS_INITIAL, CHESS_EXTRA, function(replay) {
            var r = JSON.stringify(replay);
            var replay_name = Math.random().toString(36).substring(2) + ".json";
            var file = bucket.file('replays/' + replay_name);
            var stream = file.createWriteStream({});
            stream.on('finish', ()=> {
                var url = 'https://storage.googleapis.com/battlehack/replays/' + replay_name;
                    console.log(`[Worker ${process.pid}] Match ${scrimmage.id} complete.`);
                    db.none(end_match,[
                        replay.winner===0?'redwon':'bluewon',
                        replay_name, url
                    ]).then(playGame);
                    c.destroy();
            });
            stream.end(Buffer.from(r, 'utf8'));
        }); c.playGame();
    }).catch(function(error) {
        setTimeout(playGame,Math.floor(5000*Math.random()));
    });
}

if (cluster.isMaster) {
    console.log(`Master ${process.pid} started, creating ${numCPUs} workers`);

    for (let i = 0; i < numCPUs; i++) cluster.fork();
    cluster.on('exit', (worker, code, signal) => {
        console.log(`[Worker ${worker.process.pid}] Worker died`);
    });
} else setTimeout(playGame,Math.floor(5000*Math.random()));
