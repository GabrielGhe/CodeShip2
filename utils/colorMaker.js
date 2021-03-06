exports.makeRGB = function(id){
	var tempColor = [0,0,0];
	for(var i=0; i != 30; ++i){
		if(i % 10 == 0){
			tempColor[0] += id.charCodeAt(i);
			tempColor[0] %= 100;
			tempColor[0] += 100;
		} else if(i % 10 == 1){
			tempColor[1] += id.charCodeAt(i);
			tempColor[1] %= 100;
			tempColor[1] += 100;
		} else if(i % 10 == 2){
			tempColor[2] += id.charCodeAt(i);
			tempColor[2] %= 100;
			tempColor[2] += 100;
		}
	}
	return "rgb(" + tempColor.join(',') + ")";
};