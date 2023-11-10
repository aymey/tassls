use std::error::Error;
use axum::routing::{get, post, Router};

mod handlers;

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
    start_db_connection().await?;

    Ok(())
}

async fn start_db_connection() -> Result<(), Box<dyn Error>> {
    let url = "postgres://dbuser:pass123@localhost:5432/tassls"; // hardcoded for now
    let pool = sqlx::postgres::PgPool::connect(url).await?;

    sqlx::migrate!("./migrations").run(&pool).await?;

    // let test_timetable = Timetable {
        // student_number: match read_timetables(&pool).await?.last() {
            // Some(x) => x.student_number + 1,
            // None => 1
        // }
    // };
    // test_timetable.create(&pool).await?;

    // let test = read_timetables(&pool).await?;

    // println!("StuNumb: {:?}", test);

    start_server(pool).await?;

    Ok(())
}

async fn start_server(pool: sqlx::PgPool) -> Result<(), Box<dyn Error>> {
    let port = std::env::var("PORT").unwrap_or_else(|_| "3000".to_string());
    let addr = format!("0.0.0.0:{}", port);

    println!("server running at: {}", addr);

    let app = Router::new()
        .route("/students", get(handlers::read_students))
        .route("/students", post(handlers::create_student))
        .with_state(pool);

    axum::Server::bind(&addr.parse().unwrap())
        .serve(app.into_make_service())
        .await
        .unwrap();

    Ok(())
}