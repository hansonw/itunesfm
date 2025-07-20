"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = promisify;
function promisify(obj, func, ...args) {
    return new Promise((resolve, reject) => {
        obj[func].apply(obj, args.concat((err, result) => {
            if (err != null) {
                reject(err);
            }
            else {
                resolve(result);
            }
        }));
    });
}
