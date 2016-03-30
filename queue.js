var Queue = function(size){
  this.list = new Array(size || 10);
  return this;
}

Queue.prototype.enqueue = function(elem){
  this.list.shift();  // remove first element
  this.list.push(elem);
}

module.exports = Queue;
