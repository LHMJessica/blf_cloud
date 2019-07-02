//功能菜单获取
(function ($) {
	
	//保存功能的json数据到localStorage
	var saveFunJson = function(record){
		var packs = null;
		for(var i  in record){
			var item = record[i];
			if(i == 0) {
				continue;
			} else {
				if (!packs) {
					packs = item.packs;
				} else {
					packs.push(item.packs[0]);
				}
			}
		}
		localStorage.setItem('cur_user_menu',JSON.stringify(packs));
	};
	
	// 取最新的后台授权功能列表，并重新加载业务与办公模块的功能列表
	$.updateWxFun = function(hd) {
		var hdcall = function(data){
			var record = data.funInfo||[];
			//保存功能的json数据到localStorage
			saveFunJson(record);
			if (hd) hd();
		}
		var params = "funid=app_role_fun&eventcode=queryFun";
		jxm.post(params,hdcall);
	};
	
	// 打开微信端页面
	$.openwx = function(url) {
		window.location.href = url;
	};
	
return $;
})(jxm);