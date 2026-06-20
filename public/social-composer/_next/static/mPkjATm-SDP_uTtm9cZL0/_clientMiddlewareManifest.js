self.__MIDDLEWARE_MATCHERS = [
  {
    "regexp": "^\\/social-composer(?:\\/(_next\\/data\\/[^/]{1,}))?\\/style-guide(\\.json|\\.rsc|\\.segments\\/.+\\.segment\\.rsc)?[\\/#\\?]?$",
    "originalSource": "/style-guide"
  },
  {
    "regexp": "^\\/social-composer(?:\\/(_next\\/data\\/[^/]{1,}))?\\/api\\/tokens(\\.json|\\.rsc|\\.segments\\/.+\\.segment\\.rsc)?[\\/#\\?]?$",
    "originalSource": "/api/tokens"
  }
];self.__MIDDLEWARE_MATCHERS_CB && self.__MIDDLEWARE_MATCHERS_CB()