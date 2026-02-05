const cloud = require('wx-server-sdk')

cloud.init({
  env: 'cloud1-1ga45e303c7e0c3b'
})

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  
  return {
    openid: wxContext.OPENID,
    appid: wxContext.APPID,
    unionid: wxContext.UNIONID,
  }
}
