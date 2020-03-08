// 将所有档案作为一个整体标准化
// 这个脚本仅能处理 32-bit float、档头为 44 位元组的档案
// 也不会考虑 max 或 min 为 0 的情况
'use strict';

const fs = require('fs');

let files = ['th07_07.wav'];

// 电平扫描
let max = -Infinity;
let min = Infinity;
for (let file of files) {
    let data = fs.readFileSync(file);
    let offset = 44;
    let length = data.readUInt32LE(40) + 44;
    while (offset < length) {
        let get = data.readFloatLE(offset);
        if (get > max) {
            max = get;
        };
        if (get < min) {
            min = get;
        };
        offset += 4;
    };
};

const getMlt = (num) => {
    // 16-bit integer 的范围是 [-32768, 32767]，对应 [-1, 32767 / 32768]，可见正负不对称
    // 为了避免正数削波，只能到 32767 / 32768
    // 负数则可以到 -1
    // 因此需要考虑符号
    let sign = Math.sign(num);
    // 为了防止正负倒错，比率只能是正数
    let abs = Math.abs(num);
    // 实际上这样的操作精度是没问题的，因为 JS 内部精度是 64-bit float
    // 虽然说 x / y 和 x * (1 / y) 因为精度问题不会相等，但因为计算全程使用 64-bit float，降到 32-bit float 就是相等的了
    if (sign === 1) {
        return 32767 / 32768 / abs;
    } else if (sign === -1) {
        return 1 / abs;
    } else {
        throw 'Konna mono!';
    };
};

// 为了防止削波当然只能取最小值
let mlt = Math.min(getMlt(max), getMlt(min));

// 现在就是暴力计算了
for (let file of files) {
    let data = fs.readFileSync(file);
    let offset = 44;
    let length = data.readUInt32LE(40) + 44;
    while (offset < length) {
        let get = data.readFloatLE(offset);
        data.writeFloatLE(get * mlt, offset);
        offset += 4;
    };
    fs.writeFileSync(file, data);
};
