const langmap = {
  CommonTip: {
    'default': '',
    'zh': '请使用高版本的 Chrome/FireFox/Safari 现代浏览器, 本站采用H5/Webassembly技术, 在浏览器中高效直接运行处理, 拥有与本地软件一致的体验!',
    'en': 'Audio Process',
  },

  AudioProcess: {
    'default': '',
    'zh': '音频处理',
    'en': 'Audio Process',
  },

  AudioProcessDenoise: {
    'default': '',
    'zh': '音频去噪',
    'en': 'Denoise',
  },

  DenoiseRNN: {
    'default': '',
    'zh': '神经网络去噪',
    'en': 'RNN Denoise',
  },

  DenoiseRNNDesc: {
    'default': '',
    'zh': '采用RNN AI学习算法自适应去除语音人声背景噪声;  对会议背景器械声, 白噪声, hiss噪声等噪声效果较好; 不适用于音乐去噪，切忌对音乐背景去噪',
    'en': 'RNN Denoise',
  },

  DenoiseFFTLMS: {
    'default': '',
    'zh': '频域谱减去噪2',
    'en': 'Spectrum Denoise',
  },

  DenoiseFFTLMSDesc: {
    'default': '',
    'zh': '同谱减去噪1, 只是不进行低通滤波, 频域成份保留更完整',
    'en': 'Spectrum Denoise',
  },

  DenoiseFFTLMSLPF: {
    'default': '',
    'zh': '频域谱减去噪1',
    'en': 'Spectrum Denoise',
  },

  DenoiseFFTLMSLPFDesc: {
    'default': '',
    'zh': '谱减去噪,并滤除高频噪声. 适用于白噪声/hiss噪声的场景; 增加增益值加强谱减程度, 降低截止系数去除更多高频噪声',
    'en': 'Spectrum Denoise',
  },

  DenoiseGain: {
    'default': '',
    'zh': '增益系数',
    'en': 'Denoise Gain Cof',
  },

  DenoiseLPFFc: {
    'default': '',
    'zh': '截止系数',
    'en': 'LPF fc cof',
  },

  DenoiseLearn1: {
    'default': '',
    'zh': '学习去噪1',
    'en': 'Learn noise Denoise(1)',
  },

  DenoiseLearn1Desc: {
    'default': '',
    'zh': '学习去噪1',
    'en': 'Learn noise Denoise(1)',
  },

  DenoiseLearn2: {
    'default': '',
    'zh': '学习去噪2',
    'en': 'Learn noise Denoise(2)',
  },

  DenoiseLearn2Desc: {
    'default': '',
    'zh': '学习去噪2',
    'en': 'Learn noise Denoise(2)',
  },

  AudioProcessBgm: {
    'default': '',
    'zh': '提取伴奏',
    'en': 'Extract BGM',
  },

  AudioCovert: {
    'default': '',
    'zh': '音频转换',
    'en': 'Audio Covert',
  },

  AudioCovertFormat: {
    'default': '',
    'zh': '音频转码',
    'en': 'Format Covert',
  },

  OutputFormat: {
    'default': '',
    'zh': '输出格式',
    'en': 'Output Format',
  },

  SampleRate: {
    'default': '',
    'zh': '采样率',
    'en': 'SampleRate',
  },

  Bitrate: {
    'default': '',
    'zh': '码率',
    'en': 'BitRate',
  },

  Channel: {
    'default': '',
    'zh': '通道数',
    'en': 'Channel',
  },

  Mono: {
    'default': '',
    'zh': '单声道',
    'en': 'Mono',
  },

  Stereo: {
    'default': '',
    'zh': '立体声',
    'en': 'Stereo',
  },

  Recommend: {
    'default': '',
    'zh': '推荐',
    'en': 'Recommend',
  },

  UploadProcess: {
    'default': '',
    'zh': '上传处理',
    'en': 'Upload Process',
  },



}


export default langmap

