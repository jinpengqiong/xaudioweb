const langmap = {
  AudioProcess: {
    'default': '',
    'zh': '音频处理',
    'en': 'Audio Process',
  },

  AudioProcessDenoise: {
    'default': '',
    'zh': '去噪',
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
    'zh': '格式转换',
    'en': 'Format Covert',
  },




}


export default langmap

