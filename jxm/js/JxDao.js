//本地数据库操作工具，只有chrome浏览器才可以用
//注意数据库操作都是异步操作，只能采用回调函数的方式操作数据库
JxDao = {
	//数据库操作对象
	db: null,
	
	//初始化数据库对象
	init : function() {
		if (typeof openDatabase == 'undefined') {
			alert('当前浏览器不支持数据库操作，\r\n请使用Chrome浏览器！');
			return;
		}
		this.db = openDatabase('XScanDB','','Jxstar Cloud ScanSystem DataBase',102400); 
		
		this.db.transaction(function(tx){
			//创建系统变量表
			tx.executeSql('CREATE TABLE IF NOT EXISTS sysparam(name TEXT,value TEXT)',[]); 

			//创建基础数据表
			tx.executeSql('CREATE TABLE IF NOT EXISTS basedata(key TEXT,name TEXT,type TEXT)',[]); 
			
			//创建盘点资产清单表
			tx.executeSql('CREATE TABLE IF NOT EXISTS assetscan(scan_state TEXT,scan_id TEXT, device_code TEXT, old_ass_code TEXT, asset_code TEXT, device_name TEXT, model_type TEXT, dept_name TEXT, use_state TEXT, card_user TEXT, station_name TEXT, dept_id TEXT, memo TEXT, isscan TEXT, ismore TEXT)',[]); 
			
			//创建清点数据表
			tx.executeSql('CREATE TABLE IF NOT EXISTS checkdata(device_code TEXT,dept_name TEXT,station_name TEXT,card_user TEXT,use_state TEXT)',[]); 
			
			//创建商品明细表
		    tx.executeSql('CREATE TABLE IF NOT EXISTS sp(id CHAR(150) PRIMARY KEY,sp_code TEXT,sp_position TEXT,railing_length TEXT,railing_features TEXT,count TEXT)',[]);
			
			//创建sn表
			tx.executeSql('CREATE TABLE IF NOT EXISTS sn(id CHAR(150) PRIMARY KEY,fkeyid TEXT,sn TEXT)',[]);
			
			//创建盘点表
			tx.executeSql('CREATE TABLE IF NOT EXISTS barcode(qrcode TEXT)',[]);
		});
	},
	exe: function(backCall) {
			JxDao.db.transaction(backCall);
	},
		
	//执行sql
	update: function(sql, params){
		JxDao.db.transaction(function(tx){
			tx.executeSql(sql,params,
				function(tx,rs){console.log('update sql success!');},
				function(tx,error){console.error(error.source+"::"+error.message);}
			);
		});
	},
	update1: function(sql, params,hdcall){
		JxDao.db.transaction(function(tx){
			tx.executeSql(sql,params,
				function(tx,rs){console.log('update sql success!');if(hdcall)hdcall();},
				function(tx,error){console.error(error.source+"::"+error.message);}
			);
		});
	},
	
	//取系统常用变量
	getParam : function(name, backCall) {
		JxDao.db.transaction(function(tx){
			//执行查询
			tx.executeSql('SELECT * FROM sysparam WHERE name = ?',[name],
				function(tx,rs){
					var v = '';
					if (rs.rows.length > 0) {
						v = rs.rows.item(0).value;
					}
					backCall(v);
				},
				function(tx,error){console.error(error.source+"::"+error.message);}
				); 
			});
	},

		//保存系统常用变量
		setParam : function(name, value, backCall) {
			JxDao.db.transaction(function(tx){
				//先删除再新增
				tx.executeSql('DELETE FROM sysparam WHERE name = ?',[name]);
				//新增数据
				tx.executeSql('INSERT INTO sysparam(value, name) VALUES(?, ?)',[value, name],
					function(tx,rs){if (backCall) backCall(); console.log(name +"::"+ value)},
					function(tx,error){console.error(error.source+"::"+error.message);}
				);
			});
	},
		
		//查询选项值
		queryCombo : function(type, backCall) {
			JxDao.db.transaction(function(tx){
				tx.executeSql('select key, name from basedata where type = ?',[type],
					function(tx,rs){
						var json = [];
						for (var i = 0; i < rs.rows.length; i++) {
							json[i] = rs.rows.item(i);
						}
						backCall(json);
					},
					function(tx,error){console.error(error.source+"::"+error.message);}
				);
			});
	},
		
		//通用查询数据方法，支持分页功能
		query: function(sql, params, backCall, pageSize, pageIndex) {
			JxDao.db.transaction(function(tx){
				//传入的页序号是从1开始的，需要-1
				if (pageSize && pageIndex) {
				//	sql = sql+' limit {0} offset {0}*{1}';
					sql=sql+' limit '+pageSize+' offset '+pageSize*(pageIndex-1);
					pageIndex=pageIndex-1;
					//sql = Ext.util.Format.format(sql+' limit {0} offset {0}*{1}', pageSize, pageIndex-1);
				}
				
				if (!params) params = [];
				
				tx.executeSql(sql,params,
					function(tx,rs){
						var json = [];
						for (var i = 0; i < rs.rows.length; i++) {
							json[i] = rs.rows.item(i);
						}
						backCall(json);
					},
					function(tx,error){console.error(error.source+"::"+error.message);}
				);
			});
		},
	
	//清除数据库信息，方便调整已有表的数据库结构
	clear : function() {
		var me = this, cnt = 0;
		var cb = function(){//重新创建表对象
			cnt++;
			if (cnt == 3) {
				me.init();
				alert('初始化成功！');
			}
		};
		
		this.db.transaction(function(tx){
			tx.executeSql('DROP TABLE sysparam',[],cb);
			tx.executeSql('DROP TABLE basedata',[],cb);
			tx.executeSql('DROP TABLE assetscan',[],cb);
		});
	},
	
	//初始化所有选项值
	comboData : {},
	
	//初始化所有选项值，实时提取需要回调处理，实现不方便
	initCombo : function() {
		var me = this;
		/*this.db.transaction(function(tx){
			tx.executeSql('select key, name, type from basedata order by type, key',[],
				function(tx,rs){
					var json = {};
					for (var i = 0; i < rs.rows.length; i++) {
						var d = rs.rows.item(i), t = d.type;
						if (!json[t]) json[t] = [];
						
						var len = json[t].length;
						json[t][len] = d;
					}
					me.comboData = json;
				},
				function(tx,error){console.error(error.source+"::"+error.message);}
			);
		});*/
		me.comboData = {state:[
				{key:'20', name:'在库'},
				{key:'25', name:'在用'},
				{key:'30', name:'维修'},
				{key:'40', name:'报废'},
				{key:'50', name:'盘亏'}
			]};
	}
};

(function(){
	JxDao.init();
	JxDao.initCombo();
	
})();
