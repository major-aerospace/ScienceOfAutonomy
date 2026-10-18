"""Isolated regressions: no production service or real Mongo database is contacted."""
import asyncio
import os
import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from mongomock_motor import AsyncMongoMockClient

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
os.environ.setdefault('MONGO_URL', 'mongodb://localhost:27017')
os.environ.setdefault('DB_NAME', 'isolated_review')
os.environ.setdefault('JWT_SECRET', 'isolated-test-secret-at-least-32-characters')
import server

@pytest.fixture
def client(monkeypatch):
    monkeypatch.delenv('ADMIN_EMAIL', raising=False)
    monkeypatch.delenv('ADMIN_PASSWORD', raising=False)
    monkeypatch.setattr(server, 'db', AsyncMongoMockClient().review)
    with TestClient(server.app) as c:
        yield c

def login(client):
    r = client.post('/api/auth/register', json={'email':'learner@example.com','password':'Learning123!', 'name':'Learner'})
    assert r.status_code == 200
    return {'Authorization': f"Bearer {r.json()['token']}"}

def lesson():
    return next(l for l in server.LESSONS.values() if l.get('quiz'))

def test_no_default_admin(client):
    assert asyncio.run(server.db.users.count_documents({'role':'admin'})) == 0
    assert client.post('/api/auth/login', json={'email':'admin@example.com','password':'admin123'}).status_code == 401

@pytest.mark.parametrize('email,password', [('admin@example.com',''), ('','StrongAdminPassword!'), ('admin@example.com','admin123')])
def test_partial_or_weak_admin_rejected(monkeypatch,email,password):
    monkeypatch.setattr(server, 'db', AsyncMongoMockClient().review)
    monkeypatch.setenv('ADMIN_EMAIL',email)
    monkeypatch.setenv('ADMIN_PASSWORD',password)
    with pytest.raises(RuntimeError):
        asyncio.run(server.on_startup())

def test_explicit_admin_and_no_existing_account_promotion(client,monkeypatch):
    login(client)
    monkeypatch.setenv('ADMIN_EMAIL','learner@example.com')
    monkeypatch.setenv('ADMIN_PASSWORD','StrongAdminPassword!')
    asyncio.run(server.on_startup())
    assert asyncio.run(server.db.users.find_one({'email':'learner@example.com'}))['role'] == 'user'
    monkeypatch.setenv('ADMIN_EMAIL','operator@example.com')
    asyncio.run(server.on_startup())
    r=client.post('/api/auth/login',json={'email':'operator@example.com','password':'StrongAdminPassword!'})
    assert r.json()['user']['role'] == 'admin'

@pytest.mark.parametrize('score', [-1, 2, 1e10])
def test_invalid_score_bounds(client, score):
    assert client.post('/api/progress/complete',headers=login(client),json={'lesson_id':lesson()['id'],'score':score}).status_code == 422

def test_percentage_alone_cannot_complete(client):
    headers=login(client)
    assert client.post('/api/progress/complete',headers=headers,json={'lesson_id':lesson()['id'],'score':1}).status_code == 422
    assert client.get('/api/progress',headers=headers).json()['progress'] == []

@pytest.mark.parametrize('answers', [[], [-1], [999], ['0'], [True]])
def test_invalid_answers(client,answers):
    assert client.post('/api/progress/complete',headers=login(client),json={'lesson_id':lesson()['id'],'answers':answers}).status_code == 422

def test_server_grades_and_retake_recovers_without_repeat_xp(client):
    h=login(client); l=lesson()
    wrong=[(q['answer']+1)%len(q['options']) for q in l['quiz']]
    right=[q['answer'] for q in l['quiz']]
    r=client.post('/api/progress/complete',headers=h,json={'lesson_id':l['id'],'answers':wrong,'score':1})
    assert r.status_code == 200
    assert r.json()['xpAwarded'] == 25
    assert client.get('/api/progress',headers=h).json()['progress'][0]['score'] == 0
    r=client.post('/api/progress/complete',headers=h,json={'lesson_id':l['id'],'answers':right})
    assert r.json()['xpAwarded'] == 0
    data=client.get('/api/progress',headers=h).json()
    assert data['progress'][0]['score'] == 1
    assert data['user']['xp'] == 25
    assert client.get('/api/recommend/next',headers=h).json()['lesson']['id'] != l['id']

def test_grade_uses_admin_override(client):
    h=login(client); l=lesson()
    q=l['quiz'][0]; different=(q['answer']+1)%len(q['options'])
    asyncio.run(server.db.lesson_overrides.insert_one({'id':l['id'],'quiz':[{**q,'answer':different}]}))
    r=client.post('/api/progress/complete',headers=h,json={'lesson_id':l['id'],'answers':[different]})
    assert r.json()['xpAwarded'] == 40

def test_streak_resets_after_gap(client):
    h=login(client)
    asyncio.run(server.db.users.update_one({'email':'learner@example.com'},{'$set':{'streak':8,'last_active_day':'2000-01-01'}}))
    l=lesson()
    client.post('/api/progress/complete',headers=h,json={'lesson_id':l['id'],'answers':[q['answer'] for q in l['quiz']]})
    assert client.get('/api/progress',headers=h).json()['user']['streak'] == 1

def test_unmeasured_assessment_domains_remain_null(client):
    h=login(client)
    payload={'perceptual_spatial':.8,'attentional':.9,'trainability_slope':.2}
    r=client.post('/api/assessment/submit',headers=h,json=payload)
    assert r.status_code == 200
    assert r.json()['result']['higher_order'] is None
    assert r.json()['recommendedTrack']['weakestDomain'] == 'perceptual_spatial'
    payload['attentional']=1.1
    assert client.post('/api/assessment/submit',headers=h,json=payload).status_code == 422

@pytest.mark.parametrize('endpoint', ['/api/leaderboard','/api/sim/leaderboard','/api/search'])
def test_query_limits(client, endpoint):
    assert client.get(endpoint+'?limit=-1').status_code == 422
    assert client.get(endpoint+'?limit=100000').status_code == 422

def test_password_byte_limit_and_blank_name(client):
    assert client.post('/api/auth/register',json={'email':'a@example.com','password':'é'*40,'name':'Name'}).status_code == 422
    assert client.post('/api/auth/register',json={'email':'a@example.com','password':'GoodPassword!','name':'   '}).status_code == 422
