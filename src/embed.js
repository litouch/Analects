import CoreSDK from './CoreSDK';

// 为了保持嵌入代码的一致性，我们将 CoreSDK 同样命名为 AnalectsSDK 挂载到 window 对象上
// 这样第三方用户的使用方式就和你的主站完全一样，无需关心内部实现
if (typeof window !== 'undefined') {
  window.AnalectsSDK = CoreSDK;

  // 同时，也保留全局复制方法
  window.AnalectsSDK.copyText = async function(text, button) {
    const originalTitle = button.title;
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        Object.assign(textArea.style, { position: 'fixed', left: '-999999px', top: '-999999px' });
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        if (!successful) throw new Error('Copy command failed');
      }
      button.title = '已复制！';
      setTimeout(() => { button.title = originalTitle; }, 2000);
    } catch (err) {
      console.error('复制失败:', err);
      button.title = '复制失败';
      setTimeout(() => { button.title = originalTitle; }, 2000);
    }
  };
}

export default CoreSDK;