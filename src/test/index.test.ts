import child_process from 'child_process';
import path from 'path';

console.log(process.env.http_proxy);
child_process.exec(`npx ts-node ${path.join(__dirname, '../index.ts')}`, { env: process.env }, (err, stdout, stderr) => {
    console.log(err);

    console.log(stdout);

    console.log(stderr);
});
