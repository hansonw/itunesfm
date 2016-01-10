/* @flow */

export default function promisify<T>(
  obj: Object,
  func: string,
  ...args: Array<any>
): Promise<T> {
  return new Promise((resolve, reject) => {
    obj[func].apply(obj, args.concat((err, result) => {
      if (err != null) {
        reject(err);
      } else {
        resolve(result);
      }
    }));
  });
}
