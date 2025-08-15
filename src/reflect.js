const obj = {
    _age: 10,
    get age() {
        return this._age + 1; // 虚岁
    },
    set age(value) {
        this._age = value;
    }
}
const desc = Object.getOwnPropertyDescriptor(obj, '_age');
const desc2 = Object.getOwnPropertyDescriptor(obj, 'age');
console.log(desc);
console.log(desc2);
// {
//   value: 10,
//   writable: true,
//   enumerable: true,
//   configurable: true
// }
// {
//   get: [Function: get age],
//   set: [Function: set age],
//   enumerable: true,
//   configurable: true
// }

class XRefelect {
    static get(target, propertyKey, receiver) {
        if (typeof target !== 'object' || target === null) {
            return new TypeError('XReflect.get called on non-object');
        }
        // 获取 this 指向对象
        receiver = receiver || target;
        // 递归原型链查询属性描述
        let currentDesc;
        let current = target;
        while (current) {
            // 读取对象属性的描述对象
            const nowDesc = Object.getOwnPropertyDescriptor(current, propertyKey);
            if (nowDesc) {
                currentDesc = nowDesc
                break;
            }
            current = Object.getPrototypeOf(current);
        }
        if (!currentDesc) {
            return;
        }
        // getter
        if ('get' in currentDesc) {
            return currentDesc.get.call(receiver);
        }
        // 普通value
        if ('value' in currentDesc) {
            return currentDesc.value;
        }
        return undefined;
    }

    static set(target, propertyKey, value, receiver) {
        if (typeof target !== 'object' || target == null) {
            return new TypeError('XReflect.set called on non-object');
        }
        // 获取 this 指向对象
        receiver = receiver || target;
        // 递归原型链查找属性描述
        let current = target;
        let currentDesc;
        while (current) {
            const nowDesc = Object.getOwnPropertyDescriptor(current, propertyKey);
            if (nowDesc) {
                currentDesc = nowDesc;
                break;
            }
            current = Object.getPrototypeOf(current);
        }
        // setter
        if (currentDesc && 'set' in currentDesc) {
            try {
                currentDesc.set.call(receiver, value);
                return true;
            } catch(e) {
                console.log(e);
                return false;
            }
        }
        // 普通value
        if (currentDesc && 'value' in currentDesc) {
            // 是否可写
            if (currentDesc.writable === false) {
                return false;
            }
            // 是否可扩展、冻结等？
            // 尝试设置值
            try {
                Object.defineProperty(receiver, propertyKey, {
                    ...currentDesc,
                    value,
                });
            } catch(e) {
                return false;
            }
        }
        // 不存在属性，新属性
        try {
            Object.defineProperty(receiver, propertyKey, {
                value,
                writable: true,
                enumerable: true,
                configurable: true,
            });
            return true;
        } catch(e) {
            return false;
        }
    }
}

console.log("基本属性获取:", 
    XRefelect.get(obj, '_age'),
    XRefelect.get(obj, 'age'),
    XRefelect.set(obj, 'age', 20),
    XRefelect.get(obj, 'age'),
);
// 基本属性获取: 10 11 true 21