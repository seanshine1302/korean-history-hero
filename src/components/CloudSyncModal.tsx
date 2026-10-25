import React, { useState } from 'react';
import { PlayerProfile } from '../types/game';
import { sound } from '../utils/sound';
import { uploadProfileToCloud, downloadProfileFromCloud } from '../utils/firebase';
import {
  Cloud,
  CloudUpload,
  CloudDownload,
  X,
  Copy,
  Check,
  Smartphone,
  Laptop,
  Sparkles,
  AlertCircle,
  KeyRound,
} from 'lucide-react';

interface CloudSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProfile?: PlayerProfile | null;
  onProfileImported: (profile: PlayerProfile) => void;
  onProfileUpdated?: (updatedProfile: PlayerProfile) => void;
  initialTab?: 'upload' | 'download';
}

export const CloudSyncModal: React.FC<CloudSyncModalProps> = ({
  isOpen,
  onClose,
  currentProfile,
  onProfileImported,
  onProfileUpdated,
  initialTab = 'upload',
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'download'>(initialTab);
  const [inputCode, setInputCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resultMessage, setResultMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(
    currentProfile?.cloud_sync_code || null
  );

  if (!isOpen) return null;

  // Handle Upload current profile to Cloud
  const handleUpload = async () => {
    if (!currentProfile) {
      setResultMessage({
        type: 'error',
        text: '클라우드에 올릴 여행자 캐릭터를 먼저 선택해주세요!',
      });
      return;
    }

    setLoading(true);
    setResultMessage(null);

    const res = await uploadProfileToCloud(currentProfile, currentProfile.cloud_sync_code);
    setLoading(false);

    if (res.success && res.code) {
      sound.playFanfare();
      setGeneratedCode(res.code);
      setResultMessage({
        type: 'success',
        text: `'${currentProfile.name}' 대원 정보가 안전하게 클라우드에 백업되었어요!`,
      });

      // Update current profile with cloud sync code & last sync timestamp
      if (onProfileUpdated) {
        onProfileUpdated({
          ...currentProfile,
          cloud_sync_code: res.code,
          cloud_last_synced: new Date().toISOString(),
        });
      }
    } else {
      sound.playWrong();
      setResultMessage({
        type: 'error',
        text: res.message || '클라우드 저장에 실패했습니다. 인터넷 연결을 확인해주세요.',
      });
    }
  };

  // Handle Download profile from Cloud
  const handleDownload = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = inputCode.trim().toUpperCase();
    if (!cleanCode) {
      setResultMessage({ type: 'error', text: '탐험 코드를 입력해주세요!' });
      return;
    }

    setLoading(true);
    setResultMessage(null);

    const res = await downloadProfileFromCloud(cleanCode);
    setLoading(false);

    if (res.success && res.profile) {
      sound.playFanfare();
      setResultMessage({
        type: 'success',
        text: res.message || `'${res.profile.name}' 대원을 성공적으로 불러왔습니다!`,
      });
      onProfileImported({
        ...res.profile,
        cloud_sync_code: cleanCode,
        cloud_last_synced: new Date().toISOString(),
      });
      setTimeout(() => {
        onClose();
      }, 1400);
    } else {
      sound.playWrong();
      setResultMessage({
        type: 'error',
        text: res.message || '여행자를 찾지 못했습니다. 코드를 다시 확인해주세요!',
      });
    }
  };

  const handleCopyCode = (code: string) => {
    sound.playClick();
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-3xl border-4 border-sky-400 shadow-2xl p-5 sm:p-7 space-y-5 animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-sky-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-sky-100 border-2 border-sky-300 flex items-center justify-center text-sky-700 shadow-sm">
              <Cloud className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-800">
                어디서든 이어하기 (클라우드)
              </h2>
              <p className="text-xs font-bold text-slate-500">
                스마트폰, 태블릿, PC 어디서든 내 여행자를 불러올 수 있어요
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="p-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1.5 rounded-2xl">
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              setActiveTab('upload');
              setResultMessage(null);
            }}
            className={`py-2.5 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all ${
              activeTab === 'upload'
                ? 'bg-white text-sky-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <CloudUpload className="w-4 h-4" />
            <span>내 여행자 백업하기</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sound.playClick();
              setActiveTab('download');
              setResultMessage(null);
            }}
            className={`py-2.5 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all ${
              activeTab === 'download'
                ? 'bg-white text-sky-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <CloudDownload className="w-4 h-4" />
            <span>다른 기기에서 불러오기</span>
          </button>
        </div>

        {/* Result Message Banner */}
        {resultMessage && (
          <div
            className={`p-3.5 rounded-2xl border-2 flex items-start gap-2.5 text-xs font-black animate-in fade-in slide-in-from-top-1 ${
              resultMessage.type === 'success'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                : 'bg-red-50 border-red-300 text-red-800'
            }`}
          >
            {resultMessage.type === 'success' ? (
              <Sparkles className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
            )}
            <span>{resultMessage.text}</span>
          </div>
        )}

        {/* Tab 1: Upload (내 여행자 백업하기) */}
        {activeTab === 'upload' && (
          <div className="space-y-4">
            {currentProfile ? (
              <div className="p-4 rounded-2xl bg-gradient-to-br from-sky-50 to-amber-50 border-2 border-sky-200 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-white border-2 border-sky-200 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                    <img
                      src={
                        currentProfile.gender === 'boy'
                          ? '/assets/heroes/hero_joseon_boy.png'
                          : '/assets/heroes/hero_joseon_girl.png'
                      }
                      alt={currentProfile.name}
                      className="w-12 h-12 object-contain"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-base font-black text-slate-800">
                      {currentProfile.name}
                    </span>
                    <p className="text-xs font-bold text-slate-500 mt-0.5">
                      최근 시대: 제{currentProfile.last_played_era}시대 · 푼 문제:{' '}
                      {Object.values(currentProfile.eras).reduce(
                        (acc, e) => acc + (e.solved_question_ids?.length || 0),
                        0
                      )}
                      개
                    </p>
                  </div>
                </div>

                {generatedCode ? (
                  <div className="bg-white p-3.5 rounded-xl border-2 border-sky-300 space-y-2">
                    <div className="flex items-center justify-between text-xs font-black text-slate-500">
                      <span>내 클라우드 탐험 코드</span>
                      <span className="text-emerald-600 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> 클라우드 연동됨
                      </span>
                    </div>
                    <div className="flex items-center justify-between bg-sky-50 px-3.5 py-2.5 rounded-xl border border-sky-200">
                      <span className="text-xl font-black text-sky-900 tracking-wider">
                        {generatedCode}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyCode(generatedCode)}
                        className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-black text-xs flex items-center gap-1 shadow-sm active:scale-95"
                      >
                        {copied ? (
                          <>
                            <Check className="w-3.5 h-3.5" /> 복사됨
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" /> 코드 복사
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-[11px] font-bold text-slate-500">
                      💡 다른 단말기에서 [불러오기]를 누르고 위 코드를 입력하면 그대로 이어서 할 수 있어요!
                    </p>
                  </div>
                ) : (
                  <p className="text-xs font-bold text-slate-600 bg-white/80 p-3 rounded-xl border border-sky-100">
                    아래 버튼을 누르면 이 여행자의 모든 진행 상태(골드, 유물, 레벨, 푼 문제)가 클라우드에 안전하게 보관되고 고유 탐험 코드가 발급돼요.
                  </p>
                )}

                <button
                  type="button"
                  onClick={handleUpload}
                  disabled={loading}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-black text-base shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-98 disabled:opacity-50"
                >
                  <CloudUpload className="w-5 h-5" />
                  <span>{loading ? '클라우드에 저장하는 중...' : generatedCode ? '최신 상태로 다시 백업하기' : '지금 클라우드에 백업하기'}</span>
                </button>
              </div>
            ) : (
              <div className="p-6 text-center text-sm font-bold text-slate-500 bg-slate-50 rounded-2xl border-2 border-slate-200">
                백업할 여행자를 먼저 선택해주세요.
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Download (다른 기기에서 불러오기) */}
        {activeTab === 'download' && (
          <form onSubmit={handleDownload} className="space-y-4">
            <div className="p-4 rounded-2xl bg-slate-50 border-2 border-slate-200 space-y-3">
              <div className="flex items-center gap-2 text-slate-700">
                <KeyRound className="w-5 h-5 text-sky-600" />
                <label className="text-sm font-black text-slate-800">
                  다른 기기에서 발급받은 탐험 코드를 적어주세요
                </label>
              </div>

              <input
                type="text"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                placeholder="예: KOR-8492"
                maxLength={10}
                required
                className="w-full px-4 py-3.5 text-xl font-black rounded-xl border-2 border-sky-300 focus:border-sky-500 focus:outline-none bg-white text-slate-800 tracking-wider text-center uppercase"
              />

              <div className="flex items-center gap-3 text-xs font-bold text-slate-500 bg-white p-3 rounded-xl border border-slate-200">
                <div className="flex items-center gap-1 text-sky-700 shrink-0 font-black">
                  <Smartphone className="w-4 h-4" /> ➔ <Laptop className="w-4 h-4" />
                </div>
                <span>
                  다른 폰이나 컴퓨터에서 저장한 뒤 발급받은 코드(KOR-XXXX)를 입력하면 내 기기에 그대로 복원돼요!
                </span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-black text-base shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-98 disabled:opacity-50"
              >
                <CloudDownload className="w-5 h-5" />
                <span>{loading ? '클라우드에서 찾는 중...' : '여행자 불러오기'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
