export class Buffer {
  buffer = null;
  maxSize = 0;
  flushSize = 0;
  constructor(options) {
    this.buffer = new Array();
    this.maxSize = options.size;
    this.flushSize = options.flushSize ? flushSize : options.size;
  }

  // 데이터를 입력하고 Buffer가 가득찬경우 flushSize 만큼의 데이터를 리턴
  insert = item => {
    let returnData = null;
    if (this.buffer.length == maxSize) {
      returnData = this.buffer.splice(0, flushSize);
      this.buffer.push(item);
    }

    return returnData;
  };

  // 전체 꺼내기
  flushAll = () => {
    return this.buffer.splice(0, this.buffer.length);
  };

  size = () => {
    return this.buffer.length;
  };
}
