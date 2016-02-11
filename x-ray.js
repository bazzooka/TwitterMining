var phantom = require('phantom');

phantom.create(function(ph) {

  ph.createPage(function(page) {
    page.set('settings.userAgent', 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/37.0.2062.120 Safari/537.36');
    page.open('https://t.co/T4LQc1eNV3', function(status) {
      if (status !== 'success') {
        console.error("pahtom: error opening " + anUrl, status);
        ph.exit();
      } else {
        // timeOut
        global.setTimeout(function() {
          page.evaluate(function() {
            // return document.documentElement.innerHTML;
            return {
              html: document.documentElement.innerHTML,
              title: document.title,
              url : window.location.href
            }
          }, function(result) {
            ph.exit(); // EXTREMLY IMPORTANT
            console.log(result);
          });
        }, 5000);
      }

    });
  });
});
