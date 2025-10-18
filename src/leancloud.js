// src/config/leancloud.js
import { init } from 'leancloud-storage';

const leancloudConfig = {
  appId: 'H2FWFi8F2AVzuk5TQl3jhFeU-gzGzoHsz',
  appKey: '4VRNjN9fEpzORScMIPbbKviZ',
  serverURLs: 'https://h2fwfi8f.lc-cn-n1-shared.com'
};

export const initLeanCloud = () => {
  try {
    init(leancloudConfig);
    console.log('LeanCloud 初始化成功');
    return true;
  } catch (error) {
    console.error('LeanCloud 初始化失败:', error);
    return false;
  }
};