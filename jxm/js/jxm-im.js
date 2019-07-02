(function() {
    window.IM = window.IM || {
        _appid : jxm.IM_APPID,
        _apptoken : jxm.IM_APPTOKEN,
        
        /** 以下不要动，不需要改动 */
        _username : null,
        _user_account : null,
        _onMsgReceiveListener : null,
        _onConnectStateChangeLisenter : null,
        
        //JXM消息池，用帐号为key，数据采用数组，如：
        //{"13600008888":{name:xxx, num:2, last:{type:xxx, content:xxx, new:true}, data:[]},...}
        //name 用户姓名、num 新消息数量
        pools: {},
        //当前实时通信人
        chatSender: '',
        
        /**
         * 初始化
         * 
         * @private
         */
        init : function() {
            // 初始化SDK
            var resp = RL_YTX.init(IM._appid);
            if (!resp) {
                mui.toast('初始化错误');
                return;
            };
        },

        /**
         * 初始化一些页面需要绑定的事件
         */
        initEvent : function() {
         
        },
        
		//取当前会话信息
		getSession : function() {
			var session = localStorage.getItem('cur_user');
	    	return JSON.parse(session);
		},
        
        
        login : function() {
            console.log("DO_login");
            var json = localStorage.getItem('cur_user');
			if (json && json.length > 0) {
				var data = JSON.parse(json);
				IM._login(data.im_user_code, "");
			} else {
				mui.toast("没有找到登录用户！");
			}
        },
        
        /**
         * 正式处理登录逻辑，此方法可供断线监听回调登录使用 获取时间戳，获取SIG，调用SDK登录方法
         * 
         * @param user_account
         * @param pwd 密码
         * @private
         */
        _login : function(user_account, pwd) {
            var timestamp = jxm.getTimeStamp();
        	
            var sig = hex_md5(IM._appid + user_account + timestamp + IM._apptoken);
            IM.EV_login(user_account, pwd, sig, timestamp);
        },
		
        /**
         * 事件，登录 去SDK中请求登录
         * 
         * @param user_account
         * @param sig
         * @param timestamp -- 时间戳要与生成SIG参数的时间戳保持一致
         * @constructor
         */
        EV_login : function(user_account, pwd, sig, timestamp) {
            console.log("EV_login");

            var loginBuilder = new RL_YTX.LoginBuilder();
            loginBuilder.setType("1");
            loginBuilder.setUserName(user_account);
            loginBuilder.setPwd("");
            loginBuilder.setSig(sig);
            loginBuilder.setTimestamp(timestamp);
            
            RL_YTX.login(loginBuilder, function(obj) {
                console.log("EV_login succ...");
                IM._user_account = user_account;
                
                //自动更新用户信息
                var se = IM.getSession();
                IM._username = se.user_name;
                var uib = new RL_YTX.UploadPersonInfoBuilder(se.user_name, (se.sex=='0' ? '2' : '1'), null, null);
					RL_YTX.uploadPerfonInfo(uib, function(obj){}, function(obj) {
			            alert("错误码："+obj.code+"; 错误描述："+obj.msg)
			        });
                
                // 注册PUSH监听
                IM._onMsgReceiveListener = RL_YTX.onMsgReceiveListener(
                        function(obj) {
                            IM.EV_onMsgReceiveListener(obj);
                        });
                
                // 服务器连接状态变更时的监听
                IM._onConnectStateChangeLisenter = RL_YTX.onConnectStateChangeLisenter(function(obj) {
                            // obj.code;//变更状态 1 断开连接 2 重练中 3 重练成功 4 被踢下线 5 断线需要人工重连
                            if (1 == obj.code) {
                                console.log('onConnectStateChangeLisenter obj.code:' + obj.msg);
                                mui.toast('IM连接断开');
                            } else if (2 == obj.code) {
                                //mui.toast('IM重连服务器');
                            } else if (3 == obj.code) {
                                mui.toast('IM连接成功');
                            } else if (4 == obj.code) {
                                mui.toast(obj.msg);
                                IM.DO_logout();
                                jxm.backHome("im");
                            } else if (5 == obj.code) {
                                //mui.toast('网络状况不佳，正在试图重连服务器');
                                IM._login(IM._user_account,"");
                            } else {
                                console.log('onConnectStateChangeLisenter obj.code:' + obj.msg);
                            }
                        });
                
                IM.EV_getMyInfo();
            }, function(obj) {
            	mui.toast("登录IM失败，错误描述： " + obj.msg);
                console.log("登录IM失败 错误码： " + obj.code+"; 错误描述："+obj.msg);
            });
        },
        
        /**
         * 事件，获取登录者个人信息
         * 
         * @constructor
         */
        EV_getMyInfo : function() {
            RL_YTX.getMyInfo(function(obj) {
                if (!!obj && !!obj.nickName) {
                    IM._username = obj.nickName;
                };
            }, function(obj) {
                if (520015 != obj.code) {
                    console.log("错误码： " + obj.code+"; 错误描述："+obj.msg);
                    mui.toast("获取个人信息错误："+obj.msg);
                }
            });
        },
        
        //type： 0 声音大小、 1 文件大小
        _calcSize : function(num, type) {
        	if (type == '1') {
        		if (!num || num.length == 0) return '';
                var size = 0;
                if(num < 1024){
                    size = num + "byte";
                }else if(num/1024 >= 1 && num/Math.pow(1024,2) <1){
                    size = Number(num/1024).toFixed(2) + "KB";
                }else if(num/Math.pow(1024,2) >= 1 && num/Math.pow(1024,3) <1){
                    size = Number(num/Math.pow(1024,2)).toFixed(2) + "MB";
                }else if(num/Math.pow(1024,3) >= 1 && num/Math.pow(1024,4) <1){
                    size = Number(num/Math.pow(1024,3)).toFixed(2)+"G";
                };
                return size;
        	} else {
        		if (!num || num.length == 0) return '';
            	var s = Math.round(num/512/3);//预测语音时长
            	return s+"\"";
        	}
        },
        /**
         * 事件，push消息的监听器，被动接收信息
         * 
         * @param obj
         * @constructor
         */
        EV_onMsgReceiveListener : function(obj) {
            console.log('Receive message :' + JSON.stringify(obj));
            
            //1:文本消息 2:语音消息4:图片消息6:文件
			var msgType = obj.msgType;
			var msg = {};
			if(1 == msgType || 0 == msgType){
				msg = {//文本消息
					sender: obj.msgSender,
					type: 'text',
					content: obj.msgContent
				};
			}else if(2 == msgType){
				msg = {//语音消息
					sender: obj.msgSender,
					type: 'sound',
					isnew: 'new',
					filesize: IM._calcSize(obj.msgFileSize, '0'),
					content: obj.msgFileUrl
				};
			}else if(4 == msgType){
				msg = {//图片消息
					sender: obj.msgSender,
					type: 'image',
					filesize: obj.msgFileSize,
					content: obj.msgFileUrl
				};
			}else if(6 == msgType){
				msg = {//文件消息
					sender: obj.msgSender,
					type: 'file',
					filesize: IM._calcSize(obj.msgFileSize, '1'),
					filename: obj.msgFileName,
					content: obj.msgFileUrl
				};
			}else{
				//后续还会支持(地理位置，视频，以及自定义消息等)
			}
			//消息发送者的昵称
			msg.nickname = obj.senderNickName||obj.msgSenderNick||obj.msgSender;
			//消息接收人为自己
			msg.receiver = 'self';
			
			//把消息存入消息池中
			IM._putPools(msg);
			
			//消息显示到消息列表中
			jxm.bindList(IM.pools);
			
			//把消息显示到实时通信窗口
			jxm.bindChat(msg);
        },
        
        //把新消息存入池中
        //isme: 是自己发送出去的消息，为true，时：msg.sender == 'self'
        _putPools : function(msg, isme) {
        	var cs = IM.chatSender;//当前实时通信人
        	
			//消息格式: {sender:xxx, receiver:xx, type:xx, content:xx}}
			msg.date = jxm.getTimeStamp();//消息接收时间
			
			var user = isme ? msg.receiver : msg.sender;
			var obj = IM.pools[user];
			
			if (!obj) {//{nickname:xxx, num:0, last:{type:xxx, content:xxx, new:true}, data:[]},...}
				obj = {face:false, nickname:msg.nickname, num:0, last:msg, data:[msg]};
			} else {
				obj.last = msg;
				if (obj.data.length >= 10) {//只保留10条历史消息
					obj.data.shift();
				}
				obj.data.push(msg);
			}
			
			//接收消息时才处理新消息数量
			if (!isme) {
				if (IM.chatSender == msg.sender) {//如果当前在实时通信，则新消息数量归零
					obj.num = 0;
				} else {
					obj.num += 1;
				}
				//来了新消息则给声音提示
				/*if (IM.chatSender.length == 0 && obj.num > 0) {
					var p = plus.audio.createPlayer( 'ring.wav' );
					p.play();
				}*/
			}
			
			IM.pools[user] = obj;
        },

        /**
         * 事件，登出
         * 
         * @constructor
         */
        EV_logout : function() {
            console.log("EV_logout");
            IM.DO_logout();
            RL_YTX.logout(function() {
                        console.log("EV_logout succ...");
            }, function(obj) {
                console.log("错误码： " + obj.code+"; 错误描述："+obj.msg);
                mui.toast("登出失败："+obj.msg);
            });
        },
        /**
         * 登出
         * 
         * @constructor
         */
        DO_logout : function() {
            // 销毁PUSH监听
            IM._onMsgReceiveListener = null;
            // 注册客服消息监听
            IM._onDeskMsgReceiveListener = null;
            // 服务器连接状态变更时的监听
            IM._onConnectStateChangeLisenter = null;
            //阅后即焚监听
            IM._onMsgNotifyReceiveListener = null;
            
            //界面dom元素状态处理...
            
            
        },
        
        //发送消息，im-chat.html中调用
        //消息格式: {sender:'self', receiver:xx, type:xx, content:xx, msgid:xx, nickname:xx}
        //新加状态：sending, 
        sendMsg : function(msg) {
        	var msgid = msg.msgid;
        	if (!msgid) {
        		msgid = new Date().getTime();
        		msg.msgid = msg.receiver+'_'+msgid;
        	} else {
        		var ss = msgid.split('_');
        		if (ss.length == 2) {
        			msgid = ss[1];
        		} else {
        			alert(msgid+'格式不正确！');
        			return;
        		}
        	}
        	
			//发送消息到服务器
			if(msg.type=='text') {
				  IM.EV_sendTextMsg(msg.content, msg.receiver, msg);
			} else if (msg.type=='image') {
				var url = msg.content;
				plus.io.resolveLocalFileSystemURL(
					url, 
					function(entry){
						entry.file( function(file){
							var reader = new plus.io.FileReader();
							reader.onloadend = function (e) {
								var data = e.target.result;
								var blob = jxm.makeBlob(data, "image/jpeg", msgid+".jpg");
								
								IM.EV_sendAttachMsg(blob, 4, msg.receiver, msg);
							};
							reader.readAsDataURL(file);
						});
					},
					function(e){
						mui.toast("读取本地图片文件失败：" + e.message );
					}
				);
			} else if (msg.type=='sound') {
				var url = msg.content;
				plus.io.resolveLocalFileSystemURL(
					url, 
					function(entry){
						entry.file( function(file){
							var reader = new plus.io.FileReader();
							reader.onloadend = function (e) {
								var data = e.target.result;
								var blob = jxm.makeBlob(data, "audio/amr", msgid+".amr");
								//计算声音的时长
								msg.filesize = IM._calcSize(blob.size, '0');
								IM.EV_sendAttachMsg(blob, 2, msg.receiver, msg);
							};
							reader.readAsDataURL(file);
						});
					},
					function(e){
						mui.toast("读取本地语音文件失败：" + e.message );
					}
				);
			}
        },
        
        /**
         * 事件，发送消息
         */
        EV_sendTextMsg : function(text, receiver, record) {
            console.log('send Text message: receiver:[' + receiver + ']...connent[' + text + ']...');
                                     
            //标记正在发送
            record.sending = true;
			jxm.sending(record);
			       
            var obj = new RL_YTX.MsgBuilder();
            obj.setText(text);
            obj.setType(1);
            obj.setReceiver(receiver);
            RL_YTX.sendMsg(obj, function(obj) {
                        setTimeout(function() {
                        	console.log('send Text message succ');
                        	jxm.sendSucc(record);
                        	//把消息存入消息池中
                        	delete record.isresend;
                        	delete record.sending;
							IM._putPools(record, true);
                        }, 300)
                    }, function(obj) {
                        setTimeout(function() {
                        	console.log("send Text message 错误码： :" + obj.code+"; 错误描述："+obj.msg);
                            jxm.sendError(record);
                            mui.toast("发送消息失败："+obj.msg);
                            if("170003" == obj.code || "174002" == obj.code){
                            	mui.toast("重新登录中...");
                            	IM.init();
                            	IM.login();
                            }
                        }, 300)
                    });
        },
        
        /**
         * 发送附件
         * 
         * @param file -- file对象
         * @param type -- 附件类型 2 语音消息 3 视频消息 4 图片消息 5 位置消息 6 文件消息
         * @param receiver -- 接收者
         * @param record
         */
        EV_sendAttachMsg : function(file, type, receiver, record) {
            console.log('send Attach message: type[' + type + ']...receiver:['+ receiver + ']'+'fileName:['+file.fileName+']'+'fileSize:['+file.size+']');
            var obj = new RL_YTX.MsgBuilder();
            obj.setFile(file);
            obj.setType(type);
            obj.setReceiver(receiver);
            // obj.setDomain("fireMessage");
            
            //标记正在发送
            record.sending = true;
			jxm.sending(record);
								
            RL_YTX.sendMsg(obj, function(obj) {
                        setTimeout(function() {
	                        		console.log('send Attach message succ');
									jxm.sendSucc(record);
	                                //把消息存入消息池中
	                                delete record.isresend;
	                                delete record.sending;
									IM._putPools(record, true);
	                            }, 100);
                    }, function(obj) {// 失败
                        setTimeout(function() {
                        			console.log("send Attach message 错误码： :" + obj.code+"; 错误描述："+obj.msg);
                                    jxm.sendError(record);
                                    mui.toast("发送文件失败："+obj.msg);
                           			if("170003" == obj.code || "174002" == obj.code){
		                            	mui.toast("重新登录中...");
		                            	IM.init();
		                            	IM.login();
		                            }
                                }, 100);
                    }, function(sended, total, msgId) {// 进度条
                        setTimeout(function() {
                                    console.log('send Attach message progress:'
                                            + (sended / total * 100 + '%'));
                                }, 100);
                    });
        }
};
})();
