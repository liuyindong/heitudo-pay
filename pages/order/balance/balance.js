// pages/order/balance/balance.js
const app = getApp()

var  SocketTask;
Page({
  /**
   * 页面的初始数据
   */
  data: {
    cartList: [],
    sumMonney: 0,
    cutid:0,
    cutMonney: 0,
    cupNumber:0,
    model: 0,//1是预约模式  0是到店模式
    appointTime: "",
    cutText:"",
    cutid:''
  },

  onShow: function () {
    var openid = wx.getStorageSync('openId')
   // this.webSocketHandleMsg(openid, this);
    this.getMyOrder()
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var openid = wx.getStorageSync('openId')
    this.webSocketInit(openid, this)
    if (options.model == 1) {
      this.setData({
        model: 1,
        appointTime: options.appointTime
      })
    }
    wx.setNavigationBarTitle({
      title: '订单详情'
    })
    this.setData({
      cartList: wx.getStorageSync('cartList'),
      sumMonney: wx.getStorageSync('sumMonney'),
      cupNumber: wx.getStorageSync('cupNumber'),
    })
  },
  //长链接
  webSocketInit: function (openid, that) {

    // 创建Socket
    SocketTask = wx.connectSocket({
      url: 'ws://127.0.0.1:8081/order/websocket/'+openid,
      data: 'data',
      header: {
        'content-type': 'application/json'
      },
      method: 'post',
      success: function (res) {
        console.log('WebSocket连接创建', res)
      },
      fail: function (err) {
        wx.showToast({
          title: '网络异常！',
        })
      },
    })
  },
  onUnload: function () {
    wx.closeSocket()
  },
  //获取我的优惠券
  getMyOrder: function () {
    wx.showLoading();
    var that = this;
    //获取优惠券信息
    wx.request({
      url: app.globalData.apiHost + '/reductions/user/' + wx.getStorageSync('openId'),  //&model=0
      method: 'GET',
      data: {},
      header: {
        'Accept': 'application/json'
      },
      success: function (res) {
        wx.hideLoading();
        for (let i = 0; i < res.data.length;i++){
          if (res.data[i].userStatus==0){
            if (res.data[i].type==1){
              if (wx.getStorageSync('sumMonney') > res.data[i].rule-1){
                that.setData({
                  cutText: "满" + res.data[i].rule + "元立减" + res.data[i].cut + "元",
                  cutMonney: res.data[i].cut,
                  cutid: res.data[i].id
                })
              }
            }else{
              let list = wx.getStorageSync('cartList')
              for (let j = 0; j < list.length;j++){
                if (res.data[i].name == list[j].name){
                  that.setData({
                    cutText: "单品优惠立减" + res.data[i].cut + "元",
                    cutMonney: res.data[i].cut,
                    cutid: res.data[i].id
                  })
                }
              }
              
              
            }
          }
        }
      }
    })
  },



  gopay:function(){
    // wx.navigateTo({
    //   url: '../detail/detail'
    // })
    var that =this;
   
    var total = that.data.sumMonney - that.data.cutMonney
    wx.showLoading();
    wx.request({
      url: app.globalData.apiHost + '/user-pay-befores/create',
      method: 'POST',
      data:{
        "payMoney": total,
        "openId":wx.getStorageSync('openId')
      },
      dataType: 'json',
      header: {
        'content-type': 'application/json'
      },
      success: function (res) {
        var payModel = res.data;   
          wx.requestPayment({
            'timeStamp': payModel.timeStamp,
            'nonceStr': payModel.nonceStr,
            'package': payModel.repayId,
            'signType': payModel.signType,
            'paySign': payModel.paySign,
            'success': function (res) {
              wx.showToast({
                title: '支付成功',
                icon: 'success',
                duration: 2000
              })
              that.addOrder(payModel.outTradeNo, payModel.repayId.substr(10))
            },
            'fail': function (res) {
              console.log(res)
            },
            'complete':function(res){
              console.log(res)
            }
          })

         wx.hideLoading()
      },
      fail: function () {
        wx.hideLoading()
      }
    })
  },
  //下订单
  addOrder: function (out_trade_no,repayId){
    wx.showLoading({
      title: '正在生成餐号',
    })
    var that = this;
    wx.request({
      url: app.globalData.apiHost + '/orders', //下单
      method: 'POST',
      data: {
        outTradeNo: out_trade_no,
        cartList: wx.getStorageSync('cartList'),
        sumMoney: wx.getStorageSync('sumMonney') - that.data.cutMonney,
        cutMoney: that.data.cutMonney,
        cutText:that.data.cutText,
        cupNumber: wx.getStorageSync('cupNumber'),
        model:this.data.model,
        appointTime: this.data.appointTime,
        repayId:repayId,
        remark:that.data.note,
        openId: wx.getStorageSync('openId')
      },
      dataType: 'json',
      header: {
        'content-type': 'application/json'
      },
      success: function (res) {
        wx.setStorageSync('orderInfo', res.data);
        wx.setStorageSync('cutMoney', that.data.cutMoney);
        wx.sendSocketMessage({
          data: "newOrder"
        }) 
        
        if(that.data.cutid != '' && that.data.cutid != undefined){
          that.useCut()
        }

        //购物车清空
        wx.setStorageSync('cartList')
        wx.setStorageSync('sumMonney')
        wx.setStorageSync('cupNumber')

        wx.hideLoading()
        wx.redirectTo({
          url: '../detail/detail?orderId=' + res.data.id
        })
      }
    })
  },
  //使用优惠券
  useCut: function () {
    wx.showLoading();
    var that = this;
    wx.request({
      url: app.globalData.apiHost + '/usercuts/',
      method: 'PUT',
      data: {
        "id": that.data.cutid
      },
      header: {
        'Accept': 'application/json'
      },
      success: function (res) {
        wx.hideLoading();
        console.log(res)
      }
    })
  },
  //添加备注
  note:function(e){
    console.log(e.detail.value)
    this.setData({
      note: e.detail.value
    })
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

    SocketTask.onMessage(onMessage => {
      console.log('监听WebSocket接受到服务器的消息事件。服务器返回的消息',onMessage);
    })
  },


  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
  
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
  
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
  
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
  
  }
})