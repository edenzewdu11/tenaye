import dj_database_url
import pprint
res = dj_database_url.parse("postgresql://tena_user:tena_password@db:5432/tena?sslmode=disable", ssl_require=False)
pprint.pprint(res)
