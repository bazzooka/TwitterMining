module.exports = {
  snowflake2Utc: function snowflake2Utc(time){
    return Math.floor( (time/4194304) + 1288834974657 );
  }
};
