class XPromise {
  state = 'pending';
  value = undefined;
  callbacks = [];

  constructor(executor) {
    const resolve = (value) => {
      if (this.state !== 'pending') return;
      
      // 处理 thenable 对象
      if (value && typeof value.then === 'function') {
        value.then(resolve, reject);
        return;
      }

      this.state = 'fulfilled';
      this.value = value;
      this.callbacks.forEach(item => item.onFulfilled(value));
    };

    const reject = (reason) => {
      if (this.state !== 'pending') return;
      this.state = 'rejected';
      this.value = reason;
      this.callbacks.forEach(item => item.onRejected(reason));
    };

    try {
      executor(resolve, reject);
    } catch (e) {
      reject(e);
    }
  }

  then(onFulfilled, onRejected) {
    onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : value => value;
    onRejected = typeof onRejected === 'function' ? onRejected : reason => { throw reason };

    return new XPromise((resolve, reject) => {
      const handler = () => {
        setTimeout(() => {
          try {
            const callback = this.state === 'fulfilled' ? onFulfilled : onRejected;
            const result = callback(this.value);
            
            if (result instanceof XPromise) {
              result.then(resolve, reject);
            } else {
              resolve(result);
            }
          } catch (e) {
            reject(e);
          }
        });
      };

      if (this.state === 'pending') {
        this.callbacks.push({
          onFulfilled: () => handler(),
          onRejected: () => handler()
        });
      } else {
        handler();
      }
    });
  }

  catch(onRejected) {
    return this.then(null, onRejected);
  }

  finally(callback) {
    return this.then(
      value => XPromise.resolve(callback()).then(() => value),
      reason => XPromise.resolve(callback()).then(() => { throw reason })
    );
  }

  static resolve(value) {
    return new XPromise(resolve => resolve(value));
  }

  static reject(reason) {
    return new XPromise((_, reject) => reject(reason));
  }

  static all(promises) {
    return new XPromise((resolve, reject) => {
      const results = [];
      let completed = 0;

      promises.forEach((promise, index) => {
        // 所有 promise 共用外层 reject，谁先 reject 就结束整个 all；
        // 所有 promise 自定义自己的 resolve，最后一个结束，才调用外层 resolve 结束整个 all
        XPromise.resolve(promise).then(
          value => {
            results[index] = value;
            completed++;
            if (completed === promises.length) resolve(results);
          },
          reject
        );
      });
    });
  }

  static race(promises) {
    return new XPromise((resolve, reject) => {
      promises.forEach(promise => {
        // 所有 promise 都使用外层的 resolve 和 reject，抢占第一个先执行完的
        XPromise.resolve(promise).then(resolve, reject);
      });
    });
  }
}

/********************** 测试用例 **********************/

// 基础功能测试
setTimeout(() => {
    new XPromise(resolve => {
        setTimeout(() => resolve('Hello'), 10);
    })
    .then(value => {
        console.log('1:', value); // 1: Hello
        return value + ' World';
    })
    .then(value => {
        console.log('2:', value); // 2: Hello World
        return XPromise.resolve(value + ', Everybody')
    })
    .then(value => {
        console.log('3:', value); // 3: Hello World, Everybody
        return new XPromise(resolve => {
            setTimeout(() => resolve(value + '!!'), 10);
        });
    })
    .then(value => {
        console.log('4:', value); // 4: Hello World, Everybody!!
        return XPromise.reject('The end');
    })
    .catch(console.error); // 5: The end
});

setTimeout(() => {
    console.log('===========');
    // 错误处理测试
    XPromise.reject('Intentional Error')
        .then(() => console.log('不会执行'))
        .catch(e => console.log('捕获错误:', e)) // 捕获错误: Intentional Error
        .finally(() => console.log('finally总会执行'));
}, 100);

setTimeout(() => {
    console.log('===========');
    // 静态方法测试
    XPromise.all([
        XPromise.resolve(1),
        new XPromise(r => setTimeout(() => r(2), 10)),
        3  // 非Promise值会自动转换
    ]).then(console.log); // [1, 2, 3]
}, 200);

setTimeout(() => {
    console.log('===========');
    XPromise.race([
        new XPromise(r => setTimeout(() => r('A'), 30)),
        new XPromise(r => setTimeout(() => r('B'), 20)),
    ]).then(console.log); // B
}, 300);

setTimeout(() => {
    console.log('===========');
    // thenable对象测试
    XPromise.resolve({
        then(resolve) {
            setTimeout(() => resolve('Thenable Object'), 10)
        }
    }).then(console.log); // Thenable Object
}, 400);
