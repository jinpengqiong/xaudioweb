const langmap = {
  CommonTip: {
    'default': '',
    'zh': '请使用最新高版本的 Chrome(谷歌, 推荐) | FireFox(火狐) | Safari(>=12.1) 浏览器, 本站采用H5/WebAssembly技术, 在浏览器中高效直接运行处理, 拥有与本地软件一致的体验!',
    'en': 'Audio Process',
  },

  AudioProcess: {
    'default': '',
    'zh': '音频处理',
    'en': 'Audio Process',
  },

  AudioEdit: {
    'default': '',
    'zh': '音频编辑',
    'en': 'Audio Edit',
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
    'zh': '适用说明: 采用RNN AI学习算法自适应去除语音人声背景噪声;  对会议背景器械声, 白噪声, hiss噪声等噪声效果较好; 不适用于音乐去噪，切忌对音乐背景去噪',
    'en': 'RNN Denoise',
  },

  DenoiseFFTLMS: {
    'default': '',
    'zh': '谱减去噪',
    'en': 'Spectrum Denoise',
  },

  DenoiseFFTLMSDesc: {
    'default': '',
    'zh': '适用说明: 一般频域谱减去噪, 不进行低通滤波, 频域成份保留更完整',
    'en': 'Spectrum Denoise',
  },

  DenoiseFFTLMSLPF: {
    'default': '',
    'zh': '谱减低通滤波去噪',
    'en': 'Spectrum Denoise',
  },

  DenoiseFFTLMSLPFDesc: {
    'default': '',
    'zh': "适用说明: 频域谱减去噪,同时滤除高频噪声. 适用于白噪声/hiss噪声; 增加增益值加强谱减程度, 降低截止系数去除更多高频噪声",
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

  BgmNote: {
    'default': '',
    'zh': '请输入立体声的wav文件,如若是其它格式(mp3/aac..)请先进行音频转码为wav后进行伴奏提取',
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

  AudioCovertInputSupport: {
    'default': '',
    'zh': '自动识别输入格式, 支持格式为 wav|flac|ape|mp3|aac|m4a|ac3|ogg|opus|vorbis|wma',
    'en': 'Support input format (wav|flac|ape|mp3|aac|m4a|ac3|ogg|opus|vorbis|wma)',
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

