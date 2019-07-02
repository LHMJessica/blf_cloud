(function(mui, window, document, undefined) {
	var ui = {
		zipImgOpt: {},
		imageList: document.getElementById('image-list')
	};
	var divtap = function(event){
		var me = this;
		var a = [{
			title: "拍照"
		}, {
			title: "从手机相册选择"
		}];
		plus.nativeUI.actionSheet({
			title: "选择图片",
			cancel: "取消",
			buttons: a
		}, function(b) {
			switch (b.index) {
				case 0:
					break;
				case 1:
					getImage(me);
					break;
				case 2:
					galleryImg(me);
					break;
				default:
					break
			}
		});
	};
	ui.clearImage = function() {
		ui.imageList.innerHTML = '';
		ui.newImageDiv();
	};
	ui.newImageDiv = function() {
		var imageDiv = document.createElement('div');
		imageDiv.setAttribute('class', 'image-item space');
		ui.imageList.appendChild(imageDiv);
		
		var closeButton = document.createElement('div');
		closeButton.setAttribute('class', 'image-close');
		closeButton.innerHTML = 'X';
		closeButton.addEventListener('click', function(event) {
			var pnode = this.parentNode;
			event.stopPropagation();
			event.cancelBubble = true;
			setTimeout(function() {
				ui.imageList.removeChild(pnode);
			}, 0);
			return false;
		}, false);
		imageDiv.addEventListener('tap', divtap, false);
		imageDiv.appendChild(closeButton);
	};
	//ui.newImageDiv();
	//上传图片的参数
	/* dataid, datafunid, callback */
	ui.uploadImages = function(params){
		var items = ui.imageList.querySelectorAll('div.image-item[imageNew=true]');
		var cnt = items.length;
		
		mui.each(items, function(index, item){
			var path = item.getAttribute('imagePath');
			if (!path || path.length == 0) return;
			
			var names = path.split('/');
			params.attach_path = path;
			params.attach_name = names[names.length-1];
			jxm.uploadFile(params, function(){
				if (index==(cnt-1) && params.callback) params.callback();
			});
		});
		if (cnt == 0) {
			if(params.callback) params.callback();
		}
	};
	
	//显示某单据中的图片附件
	//{dataid, tablename, isedit, callback}
	ui.downImages = function(params){
		ui.imageList.innerHTML = '';
		var id = params.dataid;
		if (!id || id.length == 0) {
			if (params.callback) params.callback();
			return;
		}
		
		var e = encodeURIComponent;
		var values = 'eventcode=query_data&funid=queryevent&pagetype=editgrid&query_funid=sys_attach';
			values += '&where_sql='+e('sys_attach.data_id = ? and sys_attach.table_name = ? and content_type like ?');
			values += '&where_type=string;string;string';
			values += '&where_value='+e(params.dataid+';'+params.tablename+';image%');
			values += '&sort=sys_attach__upload_date';
			values += '&limit=50&start=0';
		jxm.post(values, function(result){
			var datas = result.root;
			var cnt = datas.length;
			
			mui.each(datas, function(index, item){
				var keyid = item['sys_attach__attach_id'];
				var imgurl = jxm.getURL() + '?funid=sys_attach&keyid='+keyid+'&eventcode=down&nousercheck=1&user_id=administrator&dataType=byte&_dc='+(new Date()).getTime();
				console.log('...........downImages imageurl='+imgurl);
				showImageDiv(imgurl, params.isedit, keyid);
				
				if (index==(cnt-1) && params.callback) params.callback(datas);
			});
			
			//如果没有图片则不显示
			if (cnt == 0) {
				if(params.callback) params.callback(datas);
			}
		});
	};
	
	//显示单据图片时用
	var showImageDiv = function(imgurl, isedit, keyid) {
		var imageDiv = document.createElement('div');
		imageDiv.setAttribute('class', 'image-item');
		imageDiv.setAttribute('imageNew', false);
		imageDiv.setAttribute('imagePath', imgurl);
		//imageDiv.style.backgroundImage = 'url(' + imgurl + ')';
		ui.imageList.appendChild(imageDiv);
		
		var img = document.createElement('img');
		img.setAttribute('class', 'image-inner');
		imageDiv.appendChild(img);
		imageDiv.firstChild.src = imgurl;
		
		//是否可以删除
		if (isedit) {
			var closeButton = document.createElement('div');
			closeButton.setAttribute('class', 'image-close');
			closeButton.innerHTML = 'X';
			closeButton.addEventListener('click', function(event) {
				var pnode = this.parentNode;
				event.stopPropagation();
				event.cancelBubble = true;
				//从后台删除附件
				params = 'funid=sys_attach&eventcode=delete&keyid='+keyid;
				jxm.post(params,function(){
					ui.imageList.removeChild(pnode);
				});
				
				return false;
			}, false);
			imageDiv.appendChild(closeButton);
		}
	};
	
	var addImg = function(imageDiv, event){
		var img = document.createElement('img');
		img.setAttribute('class', 'image-inner');
		imageDiv.appendChild(img);
		
		imageDiv.setAttribute('imageNew', true);
		imageDiv.setAttribute('imagePath', event.target);
		//imageDiv.style.backgroundImage = 'url(' + event.target + ')';
		imageDiv.classList.remove('space');
		imageDiv.setAttribute('style', 'background-image: none;');
		imageDiv.removeEventListener('tap', divtap);
		
		img.src = event.target;
		
		ui.newImageDiv();
	};
	//拍照取图片
	var getImage = function(imageDiv) {
		var c = plus.camera.getCamera();
		c.captureImage(function(path) {
			path = "file://" + plus.io.convertLocalFileSystemURL(path);
			console.log('camera url='+path);
			//压缩图片后再发消息
			jxm.compressImage(path, function(event){
				console.log('compress image='+ JSON.stringify(event));
				
				addImg(imageDiv, event);
			}, null, ui.zipImgOpt);
			//保留在相册中
			//plus.gallery.save(e);
		}, function(e) {
			console.log("拍照失败:" + e);
		});//{filename:"_doc/gallery/",index:1}
	};
	//从相册中取图片
	var galleryImg = function(imageDiv) {
		plus.gallery.pick(function(path) {
			console.log('gallery url='+path);
			//压缩为临时图片文件
			var msgid = new Date().getTime();
			var dst = '_doc/'+msgid+'.jpg';
			mui.extend(ui.zipImgOpt, {dst:dst});
			
			//压缩图片
			jxm.compressImage(path, function(event){
				console.log('compress image='+ JSON.stringify(event));
				
				addImg(imageDiv, event);
			}, null, ui.zipImgOpt);
		}, function(e) {
			console.log("error" + e);
		}, {
			filter: "image",
			filename: "_doc/gallery/"
		})
	};
	
	jxm.imgUI = ui;
})(mui, window, document, undefined);