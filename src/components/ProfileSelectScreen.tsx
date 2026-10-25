import React, { useState } from 'react';
import { Gender, PlayerProfile } from '../types/game';
import { sound } from '../utils/sound';
import { CloudSyncModal } from './CloudSyncModal';
import { Sparkles, UserPlus, Trash2, Compass, Cloud, CloudDownload } from 'lucide-react';

interface ProfileSelectScreenProps {
  profiles: Record<string, PlayerProfile>;
  onSelectProfile: (profileId: string) => void;
  onCreateProfile: (name: string, gender: Gender) => void;
  onDeleteProfile: (profileId: string) => void;
  onImportProfile?: (profile: PlayerProfile) => void;
  onUpdateProfile?: (profile: PlayerProfile) => void;
}

export const ProfileSelectScreen: React.FC<ProfileSelectScreenProps> = ({
  profiles,
  onSelectProfile,
  onCreateProfile,
  onDeleteProfile,
  onImportProfile,
  onUpdateProfile,
}) => {
  const profileList = Object.values(profiles);
  const [isCreating, setIsCreating] = useState(profileList.length === 0);
  const [name, setName] = useState('');
  const [gender, setGender] = useState<Gender>('boy');

  // Cloud Sync Modal state
  const [syncModalOpen, setSyncModalOpen] = useState(false);
  const [syncTargetProfile, setSyncTargetProfile] = useState<PlayerProfile | null>(null);
  const [syncInitialTab, setSyncInitialTab] = useState<'upload' | 'download'>('upload');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    sound.playFanfare();
    onCreateProfile(name.trim() || '용감한 탐험가', gender);
    setName('');
    setIsCreating(false);
  };

  const openCloudBackup = (prof: PlayerProfile) => {
    sound.playClick();
    setSyncTargetProfile(prof);
    setSyncInitialTab('upload');
    setSyncModalOpen(true);
  };

  const openCloudDownload = () => {
    sound.playClick();
    setSyncTargetProfile(profileList[0] || null);
    setSyncInitialTab('download');
    setSyncModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-200 via-amber-50 to-orange-100 flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-2xl bg-white/95 backdrop-blur rounded-3xl shadow-2xl border-4 border-amber-300 p-6 sm:p-8">
        {/* Title Banner */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-800 px-4 py-1.5 rounded-full text-sm font-extrabold mb-3 border border-amber-300">
            <Compass className="w-4 h-4 text-amber-600" />
            <span>초등 역사 시간여행 어드벤처</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-800 tracking-tight">
            시간여행 <span className="text-amber-600">한국사 탐험대</span>
          </h1>
          <p className="text-base sm:text-lg text-slate-600 font-bold mt-2">
            {isCreating ? '새로운 시간여행자 카드를 만들어 볼까요?' : '누가 시간여행을 떠날까요?'}
          </p>
        </div>

        {/* Existing Profiles List */}
        {!isCreating && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {profileList.map((prof) => {
                const totalSolved = Object.values(prof.eras).reduce(
                  (acc, era) => acc + (era.solved_question_ids?.length || 0),
                  0
                );
                const avatarSrc =
                  prof.gender === 'boy'
                    ? '/assets/heroes/hero_joseon_boy.png'
                    : '/assets/heroes/hero_joseon_girl.png';

                return (
                  <div
                    key={prof.id}
                    onClick={() => {
                      sound.playClick();
                      onSelectProfile(prof.id);
                    }}
                    className="group relative flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border-3 border-amber-300 hover:border-amber-500 hover:shadow-lg transition-all cursor-pointer active:scale-98"
                  >
                    <div className="w-20 h-20 rounded-2xl bg-white border-2 border-amber-200 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                      <img
                        src={avatarSrc}
                        alt={prof.name}
                        className="w-16 h-16 object-contain group-hover:scale-110 transition-transform"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xl font-black text-slate-800 truncate">
                          {prof.name}
                        </span>
                        <span className="text-xs font-extrabold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900">
                          {prof.gender === 'boy' ? '남자 대원' : '여자 대원'}
                        </span>
                        {prof.cloud_sync_code && (
                          <span className="text-[10px] font-black px-1.5 py-0.2 rounded bg-sky-100 text-sky-800 border border-sky-300 flex items-center gap-0.5">
                            <Cloud className="w-2.5 h-2.5" />
                            {prof.cloud_sync_code}
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-bold text-slate-600 mt-1">
                        최근 여행: 제{prof.last_played_era}시대
                      </p>
                      <p className="text-xs font-bold text-amber-700 mt-0.5">
                        해결한 역사 문제: {totalSolved}개
                      </p>
                    </div>

                    <div className="flex flex-col gap-1 items-end shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openCloudBackup(prof);
                        }}
                        className="p-2 rounded-xl text-sky-600 hover:bg-sky-100/70 transition-colors"
                        title="클라우드 백업 및 탐험 코드 확인"
                      >
                        <Cloud className="w-5 h-5" />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          sound.playClick();
                          if (window.confirm(`'${prof.name}' 여행자 기록을 지울까요?`)) {
                            onDeleteProfile(prof.id);
                          }
                        }}
                        className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                        title="프로필 삭제"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Action Buttons: Create New + Cloud Download */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  setIsCreating(true);
                }}
                className="py-4 px-4 rounded-2xl border-3 border-dashed border-amber-400 bg-amber-50/60 hover:bg-amber-100/80 text-amber-900 font-black text-base flex items-center justify-center gap-2 transition-all active:scale-98"
              >
                <UserPlus className="w-5 h-5 text-amber-700" />
                <span>+ 새 여행자 만들기</span>
              </button>

              <button
                type="button"
                onClick={openCloudDownload}
                className="py-4 px-4 rounded-2xl border-3 border-sky-400 bg-sky-50/70 hover:bg-sky-100 text-sky-900 font-black text-base flex items-center justify-center gap-2 transition-all active:scale-98 shadow-sm"
              >
                <CloudDownload className="w-5 h-5 text-sky-700" />
                <span>다른 기기에서 불러오기</span>
              </button>
            </div>
          </div>
        )}

        {/* Create New Profile Form */}
        {isCreating && (
          <form onSubmit={handleCreate} className="space-y-6">
            <div>
              <label className="block text-lg font-extrabold text-slate-700 mb-2">
                1. 여행자 이름을 적어 주세요
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="예: 홍길동"
                maxLength={12}
                required
                className="w-full px-5 py-4 text-xl font-black rounded-2xl border-3 border-amber-300 focus:border-amber-500 focus:outline-none bg-amber-50/40 text-slate-800 placeholder:text-slate-400"
              />
            </div>

            <div>
              <label className="block text-lg font-extrabold text-slate-700 mb-3">
                2. 캐릭터를 골라 주세요
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setGender('boy');
                  }}
                  className={`p-4 rounded-2xl border-4 flex flex-col items-center gap-2 transition-all ${
                    gender === 'boy'
                      ? 'border-blue-500 bg-blue-50 shadow-md scale-[1.02]'
                      : 'border-slate-200 bg-white opacity-75 hover:opacity-100'
                  }`}
                >
                  <img
                    src="/assets/heroes/hero_joseon_boy.png"
                    alt="남자 탐험가"
                    className="w-24 h-24 object-contain"
                  />
                  <span className="text-lg font-black text-slate-800">남자 탐험가</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setGender('girl');
                  }}
                  className={`p-4 rounded-2xl border-4 flex flex-col items-center gap-2 transition-all ${
                    gender === 'girl'
                      ? 'border-pink-500 bg-pink-50 shadow-md scale-[1.02]'
                      : 'border-slate-200 bg-white opacity-75 hover:opacity-100'
                  }`}
                >
                  <img
                    src="/assets/heroes/hero_joseon_girl.png"
                    alt="여자 탐험가"
                    className="w-24 h-24 object-contain"
                  />
                  <span className="text-lg font-black text-slate-800">여자 탐험가</span>
                </button>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              {profileList.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setIsCreating(false);
                  }}
                  className="px-6 py-4 rounded-2xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-extrabold text-lg transition-colors"
                >
                  취소
                </button>
              )}
              <button
                type="submit"
                className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black text-xl shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-98"
              >
                <Sparkles className="w-6 h-6" />
                <span>여행자 등록 완료!</span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Cloud Sync Modal */}
      {syncModalOpen && (
        <CloudSyncModal
          isOpen={syncModalOpen}
          onClose={() => setSyncModalOpen(false)}
          currentProfile={syncTargetProfile}
          initialTab={syncInitialTab}
          onProfileImported={(importedProfile) => {
            onImportProfile?.(importedProfile);
          }}
          onProfileUpdated={(updatedProfile) => {
            onUpdateProfile?.(updatedProfile);
          }}
        />
      )}
    </div>
  );
};
