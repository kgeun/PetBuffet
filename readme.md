[petbuffet]: http://10.105.185.181

# PetBuffet
<p align="center">
  <img src="./readme_image/example.jpg">
</p>
[PetBuffet][petbuffet]은 시중에 나와있는 강아지 사료들의 성분 및 영양정보를 분석해주는 웹서비스입니다.<br>
각 사료들에 대한 리뷰 기능을 탑재해 사료에 대한 사람들의 평가 또한 확인 가능한 점이 특징입니다.

### 기능 소개

#### 기본 기능
* 사료정보 보기 / 쓰기 / 수정 / 삭제
* 리뷰 보기 / 쓰기 / 수정 / 삭제
* 댓글 보기 / 쓰기 / 수정 / 삭제
* 사료정보 검색, 필터링
* 리뷰 / 전체 리뷰 검색
* 로그인 / 로그아웃 / 회원가입
* 비밀번호 암호화 저장

#### 추가 기능
* 사료 영양정보 차트로 표현
* 리뷰 추천 / 비추천
* 전체 리뷰 보기
* 네이버 쇼핑 정보
* 네이버 최저가 정보
* 사료에 대한 평점 주기
* 비밀번호 이중 암호화 (클라이언트 단)
* 리뷰 HTML 에디터 적용
* 사료 검색 자동완성

### 기술 스택
* Express.js (WAS, 포트 80)
* Nginx (파일 서버, 포트 8080)
* MySQL (DBMS)
* jQuery

## 프로젝트 설치 및 실행
### git clone, npm install
    git clone https://oss.navercorp.com/nbp-internship-2018-team3/kyunggeun.lee.git
    cd kyunggeun.lee
    npm install

### 프로젝트 실행
    NODE_ENV=production node app.js

### 배포된 서버 정보 (테스트 아이디 / PW : aaaaa / aaaaa)
    10.105.185.181
