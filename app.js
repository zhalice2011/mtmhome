const serverConfig = require('./config/index.js').serverConfig;
const base64 = require("./utils/base64.modified.js");

//app.js
App({
    // 小程序启动之后 触发
    onLaunch: function () {
        // 展示本地存储能力
        var logs = wx.getStorageSync('logs') || []
        logs.unshift(Date.now())
        wx.setStorageSync('logs', logs)
        console.log("wx.getStorageSync", logs)
        // 登录
        wx.login({
            success: res => {
                // 发送 res.code 到后台换取 openId, sessionKey, unionId
                console.log("第一次进入微信获取的值", res);
                // 存储code
                wx.request({
                    url: serverConfig.url + '/user/login',
                    data: {
                        code: res.code
                    },
                    method: 'POST',
                    success: function (res) {
                        console.log("接受到的数据", res.data.data.openid)
                        wx.setStorageSync('openid', res.data.data.openid)
                        console.log("openid", wx.getStorageSync('openid'))

                    }
                });

            }
        })
        // 获取用户信息
        wx.getSetting({
            success: res => {
                if (res.authSetting['scope.userInfo']) {
                    // 已经授权，可以直接调用 getUserInfo 获取头像昵称，不会弹框
                    wx.getUserInfo({
                        success: res => {
                            // 可以将 res 发送给后台解码出 unionId
                            this.globalData.userInfo = res.userInfo
                            // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
                            // 所以此处加入 callback 以防止这种情况
                            if (this.userInfoReadyCallback) {
                                this.userInfoReadyCallback(res)
                            }
                        }
                    })
                }
            }
        })
        // 蓝牙
        this.startConnect()
    },
    // 开始蓝牙连接
    startConnect: function () {
        console.log('startConnect')
        var that = this;
        wx.showLoading({
            title: '开启蓝牙适配'
        });
        // 初始化小程序蓝牙模块
        wx.openBluetoothAdapter({
            // 初始化成功
            success: function (res) {
                console.log('初始化小程序蓝牙模块成功,用户已经开启', res)
                that.getBluetoothAdapterState();
            },
            // 初始化失败
            fail: function (err) {
                console.log('初始化小程序蓝牙模块失败', err)
                // 弹窗Toast
                wx.showToast({
                    title: '蓝牙初始化失败',
                    icon: 'success',
                    duration: 2000
                })
                wx.showLoading({
                    title: '请打开蓝牙',
                    icon: 'loading',
                    duration: 2000
                })
                // 2s后关闭弹窗Toast
                setTimeout(function () {
                    wx.hideToast()
                }, 2000)

            }
        })

        // 开启蓝牙适配器状态监听。
        wx.onBluetoothAdapterStateChange(function (res) {
            var available = res.available;
            if (available) { // 用户没有开启系统蓝牙
                that.getBluetoothAdapterState(); //开始扫描附近的蓝牙设备
            }
        })
    },
    // 开始扫描附近的蓝牙设备
    getBluetoothAdapterState: function () {
        var that = this;
        // 获取本机的蓝牙适配器状态
        wx.getBluetoothAdapterState({
            success: function (res) {
                var available = res.available,
                    discovering = res.discovering;
                if (!available) {
                    wx.showToast({
                        title: '设备无法开启蓝牙连接',
                        icon: 'success',
                        duration: 2000
                    })
                    setTimeout(function () {
                        wx.hideToast()
                    }, 2000)
                } else {
                    if (!discovering) {
                        // 开始扫描附近的蓝牙设备
                        that.startBluetoothDevicesDiscovery();
                        // 开启获取本机已配对的蓝牙设备
                        that.getConnectedBluetoothDevices();
                    }
                }
            }
        })
    },
    // 开始搜索蓝牙设备startBluetoothDevicesDiscovery() , 提示蓝牙搜索。
    startBluetoothDevicesDiscovery: function () {
        var that = this;
        wx.showLoading({
            title: '蓝牙搜索中...'
        });
        // 开始搜寻附近的蓝牙外围设备。注意，该操作比较耗费系统资源，请在搜索并连接到设备后调用 stop 方法停止搜索。
        wx.startBluetoothDevicesDiscovery({
            services: [], // 蓝牙设备主 service 的 uuid 列表
            allowDuplicatesKey: false, // 是否允许重复上报同一设备， 如果允许重复上报，则onDeviceFound 方法会多次上报同一设备，但是 RSSI 值会有不同
            success: function (res) {
                if (!res.isDiscovering) { // 开启蓝牙搜索功能失败
                    // 回到第2步重新检查蓝牙是适配器是否可用
                    that.getBluetoothAdapterState();
                } else { // 开启蓝牙搜索功能成功
                    // 开启发现附近蓝牙设备事件监听
                    that.onBluetoothDeviceFound();
                }
            },
            fail: function (err) {
                console.log(err);
            }
        });
    },
    // 终止扫描蓝牙设备
    stopBluetoothDevicesDiscovery: function() {
        wx.stopBluetoothDevicesDiscovery({
            success: function (res) {
              console.log('已经终止扫描蓝牙设备', res)
            }
        })
    },
    // 获取本机已配对的蓝牙设备列表
    getConnectedBluetoothDevices: function () {    
        var that = this; 
        console.log('getConnectedBluetoothDevices')   
        // 根据 uuid 获取处于已连接状态的设备
        wx.getConnectedBluetoothDevices({      
            services: [that.serviceId],
            success: function (res) {        
                console.log("获取处于连接状态的设备", res);        
                var devices = res['devices'],
                    flag = false,
                    index = 0,
                    conDevList = [];        
                devices.forEach(function (value, index, array) {          
                    if (value['name'].indexOf('FeiZhi') != -1) {             // 如果存在包含FeiZhi字段的设备
                                    
                        flag = true;            
                        index += 1;            
                        conDevList.push(value['deviceId']);            
                        that.deviceId = value['deviceId'];            
                        return;          
                    }        
                });        
                if (flag) {          
                    this.connectDeviceIndex = 0;          
                    that.loopConnect(conDevList);        
                } else {          
                    if (!this.getConnectedTimer) {            
                        that.getConnectedTimer = setTimeout(function () {              
                            that.getConnectedBluetoothDevices();            
                        }, 5000);          
                    }        
                }      
            },
            fail: function (err) {        
                if (!this.getConnectedTimer) {          
                    that.getConnectedTimer = setTimeout(function () {            
                        that.getConnectedBluetoothDevices();          
                    }, 5000);        
                }      
            }    
        });  
    },

    // 发现附近蓝牙设备事件监听事件
    onBluetoothDeviceFound: function () {
        var that = this;
        console.log('onBluetoothDeviceFound');
        wx.onBluetoothDeviceFound(function (res) {
            console.log('new device list has founded')
            console.log(res);
            if (res.devices[0]) {
                var name = res.devices[0]['name'];
                if (name != '') {
                    if (name.indexOf('PM') != -1) {
                        // 获取到该设备的deviceId
                        var deviceId = res.devices[0]['deviceId'];
                        that.deviceId = deviceId;
                        console.log('心电计的deviceId =  ', that.deviceId);
                        that.startConnectDevices();
                    }
                }
            }
        })
    },

    // 与心电计设备配对
    startConnectDevices: function (ltype, array) {
        console.log('与心电计设备配对');
        var that = this;
        clearTimeout(that.getConnectedTimer);
        that.getConnectedTimer = null;
        clearTimeout(that.discoveryDevicesTimer);

        // 一旦开启连接则终止扫描附近蓝牙设备
        that.stopBluetoothDevicesDiscovery();
        this.isConnectting = true;
        // 连接低功耗蓝牙设备。
        wx.createBLEConnection({
            deviceId: that.deviceId, // 传入deviceId
            success: function (res) {
                if (res.errCode == 0) {
                    setTimeout(function () {
                        //获取设备的所有服务
                        that.getService(that.deviceId);
                    }, 5000)
                }
            },
            fail: function (err) {
                console.log('连接失败：', err);
                if (ltype == 'loop') {
                    that.connectDeviceIndex += 1;
                    that.loopConnect(array);
                } else {
                    that.startBluetoothDevicesDiscovery();
                    that.getConnectedBluetoothDevices();
                }
            },
            complete: function () {
                console.log('complete connect devices');
                this.isConnectting = false;
            }
        });
    },
    getService: function (deviceId) {    
        console.log('获取设备所有服务')
        var that = this;     // 监听蓝牙连接
        // 蓝牙链接随时可能断开，使用监听 wx.onBLEConnectionStateChange 回调事件
        wx.onBLEConnectionStateChange(function (res) {      
            console.log(res);    
        });     
        // 获取蓝牙设备所有 service（服务）          
        wx.getBLEDeviceServices({      
            deviceId: deviceId,
            success: function (res) {  
                // 读取服务特征值     
                that.getCharacter(deviceId, res.services);      
            }    
        })
    },
    // 读取服务特征值     
    getCharacter: function (deviceId, services) {  
        console.log ('读取服务特征值传入的deviceId = ', deviceId) 
        console.log ('读取服务特征值传入的services = ', services) 
        var that = this;    
        services.forEach(function (value, index, array) {  
            console.log('value = ', value)    
            console.log('array = ', array)    
            console.log('that.serviceId = ', that.serviceId)  
            that.serviceId = '49535343-FE7D-4AE5-8FA9-9FAFD205E455'  
            if (value.uuid == that.serviceId) {        
                that.serviceId = array[index].uuid;      
            }    
        });  
        console.log ('蓝牙服务 uuid that.serviceId = ', that.serviceId) 

        // 获取蓝牙设备某个服务中的所有 characteristic（特征值）
        wx.getBLEDeviceCharacteristics({      
            deviceId: deviceId, // 蓝牙设备 id，参考 device 对象
            serviceId: that.serviceId, // 蓝牙服务 uuid
            success: function (res) {  
                console.log('成功获取特征值res = ',res)   
                res.characteristics.forEach(function(val){
                    if(val.properties.write &&  val.properties.read && val.properties.notify) {
                        that.characterId_write = val.uuid
                        that.characterId_read = val.uuid
                    }
                })
                that.writeBLECharacteristicValue(deviceId, that.serviceId, that.characterId_write);        
                that.openNotifyService(deviceId, that.serviceId, that.characterId_read);      
            },
            fail: function (err) {        
                console.log(err);      
            },
                  complete: function () {        
                console.log('complete');      
            }    
        })
    },
    // 向低功耗蓝牙设备特征值中写入二进制数据
    writeBLECharacteristicValue: function(deviceId, serviceId, characterId_write) {
        // 向蓝牙设备发送一个0x00的16进制数据
        var buffer = new ArrayBuffer(1)
        var dataView = new DataView(buffer)
        dataView.setUint8(0, 0)

        wx.writeBLECharacteristicValue({
            // 这里的 deviceId 需要在上面的 getBluetoothDevices 或 onBluetoothDeviceFound 接口中获取
            deviceId: deviceId,
            // 这里的 serviceId 需要在上面的 getBLEDeviceServices 接口中获取
            serviceId: serviceId,
            // 这里的 characteristicId 需要在上面的 getBLEDeviceCharacteristics 接口中获取
            characteristicId: characterId_write,
            // 这里的value是ArrayBuffer类型
            value: buffer,
            success: function (res) {
                console.log('写入数据成功', res)
                console.log('writeBLECharacteristicValue success', res.errMsg)
            }
        })
    },
    // 启动监听特征值的变化
    openNotifyService: function(deviceId, serviceId, characterId_read) {
        var that = this;    

        wx.notifyBLECharacteristicValueChange({
            state: true, // 启用 notify 功能
            // 这里的 deviceId 需要已经通过 createBLEConnection 与对应设备建立链接  
            deviceId: deviceId,
            // 这里的 serviceId 需要在上面的 getBLEDeviceServices 接口中获取
            serviceId: serviceId,
            // 这里的 characteristicId 需要在上面的 getBLEDeviceCharacteristics 接口中获取
            characteristicId: characterId_read,
            success: function (res) {
                console.log('启动监听特征值的变化成功', res)
                console.log('notifyBLECharacteristicValueChange success', res.errMsg)
                //发现特征值变化 进行读取设备的值
                that.readBLECharacteristicValue(deviceId, serviceId, characterId_read)
            }
        })
    },

    // 读取设备的值
    readBLECharacteristicValue: function(deviceId, serviceId, characterId_read) {
        wx.onBLECharacteristicValueChange(function (res) {   
            console.log('res', res)   
            //处理数据，将Arraybuffer转换为base64，在将base64转换为字符串              
             var base64str = base64.decode(wx.arrayBufferToBase64(res.value))//base64解密            
             console.log('达理base64str', base64str)
             let TaglistArray = []
             TaglistArray.push(base64str)              
             that.setData({
               Taglist: TaglistArray,
             })
             console.log('达理base64str', TaglistArray)
        })
        wx.readBLECharacteristicValue({
            // 这里的 deviceId 需要已经通过 createBLEConnection 与对应设备建立链接  [**new**]
            deviceId: deviceId,
            // 这里的 serviceId 需要在上面的 getBLEDeviceServices 接口中获取
            serviceId: serviceId,
            // 这里的 characteristicId 需要在上面的 getBLEDeviceCharacteristics 接口中获取
            characteristicId: characterId_read,
            success: function (res) {
              console.log('获取心电计数据成功readBLECharacteristicValue:', res)
            }
        })
    },
    globalData: {
        userInfo: null
    }
})
