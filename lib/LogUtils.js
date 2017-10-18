(function() {

	var util = require('util');

	module.exports = {

		logtrace: function(message, color) {
			//just log the message with a timestamp
			util.log(message);
		},

		addUselessZero: function(num) {
			if(num < 10) {
				return '0' + num.toString();
			}

			return num;
		}
	}

})();