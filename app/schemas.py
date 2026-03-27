from marshmallow import Schema, fields, validate, validates, ValidationError
class RegisterSchema(Schema):
    username = fields.Str(required=True, validate=validate.Length(min=3, max=80))
    email = fields.Email(required=True)
    password = fields.Str(required=True, validate=validate.Length(min=6))
class LoginSchema(Schema):
    email = fields.Email(required=True)
    password = fields.Str(required=True)
class MovieUpdateSchema(Schema):
    genre = fields.Str(validate=validate.Length(max=200))
    rating = fields.Str(validate=validate.OneOf(["G", "PG", "PG-13", "R", "NC-17", "NR"]))
    release_year = fields.Int(validate=validate.Range(min=1888, max=2100))
    overview = fields.Str()
class ReviewSchema(Schema):
    rating = fields.Int(required=True, validate=validate.Range(min=1, max=10))
    body = fields.Str(validate=validate.Length(max=2000))
class MovieSearchSchema(Schema):
    title = fields.Str(required=True, validate=validate.Length(min=1, max=200))
class MovieFilterSchema(Schema):
    genre = fields.Str()
    rating = fields.Str(validate=validate.OneOf(["G", "PG", "PG-13", "R", "NC-17", "NR"]))
    year = fields.Int()
    sort_by = fields.Str(validate=validate.OneOf(["title", "release_year", "added_at", "rating"]))
    order = fields.Str(validate=validate.OneOf(["asc", "desc"]), load_default="asc")
    page = fields.Int(validate=validate.Range(min=1), load_default=1)
    per_page = fields.Int(validate=validate.Range(min=1, max=200), load_default=12)
