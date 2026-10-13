'use client';

import { useState, useEffect, useCallback } from 'react';

const ADMIN_STORAGE_KEY = 'ADMIN_CLEARANCE_SESSION';
const MASTER_PASSWORD = 'master';

/**
 * 사서 전역 인가(Admin Clearance) 세션 관리 훅
 * - sessionStorage를 통해 브라우저 세션 동안 인증 상태를 지속합니다.
 * - RESTRICTED 스탬프가 찍힌 카드의 열람 권한을 제어합니다.
 */
export function useAdminClearance() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  // 마운트 시 sessionStorage로부터 인증 상태 복원
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(ADMIN_STORAGE_KEY);
      if (stored === 'true') {
        setIsAuthenticated(true);
      }
    } catch {
      // sessionStorage 접근 불가 환경 예외 처리
    } finally {
      setIsInitialized(true);
    }
  }, []);

  // 암호 검증 및 로그인
  const login = useCallback((password: string): boolean => {
    const trimmed = password.trim().toLowerCase();
    if (trimmed === MASTER_PASSWORD) {
      setIsAuthenticated(true);
      try {
        sessionStorage.setItem(ADMIN_STORAGE_KEY, 'true');
      } catch {
        // sessionStorage 저장 불가 예외 처리
      }
      return true;
    }
    return false;
  }, []);

  // 권한 반납 및 로그아웃
  const logout = useCallback(() => {
    setIsAuthenticated(false);
    try {
      sessionStorage.removeItem(ADMIN_STORAGE_KEY);
    } catch {
      // 예외 처리
    }
  }, []);

  return {
    isAuthenticated,
    isInitialized,
    login,
    logout,
  };
}
