/**
 * 发布订阅模式（观察者模式）
 */
class EventEmitter {
    events = {};
    constructor() {}
    // 订阅
    on(event, callback) {
        // 同个方法可以多次订阅，所以需要定义数组
        this.events[event] = this.events[event] || [];
        this.events[event].push(callback);
    }

    // 取消订阅
    off(event, callback) {
        if (!this.events[event]) return;
        if (!callback) {
            // 没有回调函数则取消所有订阅者
            delete this.events[event];
        } else {
            this.events[event] = this.events[event].filter(cb => cb !== callback);
        }
    }

    // 触发事件
    emit(event, ...args) {
        if (!this.events[event]) return;
        const listeners = this.events[event];
        for (const listener of listeners) {
            listener.apply(this, args);
        }
    }
}

const emitter = new EventEmitter();
// 订阅消息
const msgA = (...args) => console.log('A: 我接受到数据了', ...args);
const msgB = (...args) => console.log('B: 我接受到数据了', ...args);
const msgC = (...args) => console.log('C: 我接受到数据了', ...args);
emitter.on('message', msgA);
emitter.on('message', msgB);
emitter.on('message', msgC);

// 发布消息
emitter.emit('message', 'hello', 'world', '!', '这里ABC都收到消息');
// 控制台输出
// A: xxx
// B: xxx
// C: xxx

// 取消单个订阅
emitter.off('message', msgA);
emitter.emit('message', '我取消A消息');
// 控制台输出
// A不见了
// B: xxx
// C: xxx

// 取消所有订阅
emitter.off('message');
emitter.emit('message', '这里应该没消息输出了');
// 无消息输出
