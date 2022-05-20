/*
 * © Copyright 2022 Micro Focus or one of its affiliates.
 * Licensed under the MIT License (the "License");
 * you may not use this file except in compliance with the License.
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import child_process from 'child_process';
import path from 'path';

console.log(process.env.http_proxy);
child_process.exec(`npx ts-node ${path.join(__dirname, '../index.ts')}`, { env: process.env }, (err, stdout, stderr) => {
    console.log(err);

    console.log(stdout);

    console.log(stderr);
});
